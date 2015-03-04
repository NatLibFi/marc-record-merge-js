// determine preference

(function(root, factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define(['q'], factory);
	} else if(typeof exports === 'object') {
		module.exports = factory(require('q'));  // jshint ignore:line
	} else {
		root.MelindaPreferenceSelector = factory(root.Q);
	}
}(this, function(Q) {
	"use strict";

	function PreferredRecordSelector() {

		//array of records?
		this.preferenceOrder = function(record1, record2) {

		};

		// Two vectors may have dates etc, that need to be normalized somehow.
		this.normalizeVectors = function(vector1, vector2, normalizers) {

			var vector1copy = vector1.slice();
			var vector2copy = vector2.slice();

			normalizers.forEach(function(normalizerFunc, index) {
				if (typeof normalizerFunc !== 'function') {
					return;
				}
				vector1[index] = normalizerFunc.call(this, vector1copy[index], vector2copy[index]);
				vector2[index] = normalizerFunc.call(this, vector2copy[index], vector1copy[index]);

			});

		};

		this.generateFeatureVector = function(record, featureArray) {
			var self = this;
	
			return featureArray.map(function(extractorFunc) {
				return extractorFunc.call(self, record);
			});
	

		};
		// Feature extractors for determining preference

		/*
		Encoding level
		 This has some special cases, since other organizations use 4 and others 5 for same meaning, 
		 whereas 5 may be better because it's done by fennica or something. 

		 Points given: 
		 	1-3: 5
		 	4-6: 4
		 	7-8: 3
		 	y,z: 2
		 	#  : 1 (<- is this the best actually?)

		 	0 points if encoding level is invalid.

		 returns [0,n]
		*/

		this.extractEncodingLevel = function(record) {
			if (record.leader === undefined || record.leader.length < 17) {
				return undefined;
			}

			var encodingLevel = record.leader.charAt(17);
			if (encodingLevel === "#") {
				return 4;
			}
			if (['u','z'].indexOf(encodingLevel) !== -1) {
				return null;
			}

			if (['1','2', '4'].indexOf(encodingLevel) !== -1) {
				return 3;
			}
			if (['5','7'].indexOf(encodingLevel) !== -1) {
				return 2;
			}
			if (['3','8'].indexOf(encodingLevel) !== -1) {
				return 1;
			}
			// invalid encoding level
			return null;
			
		};

		this.extractPublicationYear = function(record) {
			var extractFunc = this.extractControlfieldPosition('008', 7,4);
			return extractFunc(record);

		};

		/*

		008 Cataloging source (index 39)
		ranking:
		kansallisbibliografia>yhteisö>muu>tuntematon>eikoodattu.

		Points awared:
		# = 4
		c = 3
		d = 2
		u = 1
		| = 0

		returns [0,1,2,3,4]
		 */
		this.extractCatalogingSourceFrom008 = function(record) {
			var extractFunc = this.extractControlfieldPosition('008', 39);
			var value = extractFunc(record);
			switch(value) {
				case '#': return 4;
				case 'c': return 3;
				case 'd': return 2;
				case 'u': return 1;
				case '|': return 0;
			}
			return 0;
			

		};

		this.extractNonFinnishHELKA = function(record) {
			var extractFunc = this.extractControlfieldPosition('008', 35,3);
			var language = extractFunc(record);
			if (language.toLowerCase() !== "fin") {

				var hasHELKA = this.extractSpecificLocalOwner('HELKA');
				if (hasHELKA(record)) {
					return 1;
				}
			}
			return 0;

		};

		// returns 1 if the record has only given localownertag
		this.extractSpecificSingleLocalOwner = function(localOwnerTag) {

			var self = this;
			return function(record) {
		
				var localOwnerFields = self.extractLocalOwnerList(record);
				if (localOwnerFields.length == 1 &&
					localOwnerFields[0] == localOwnerTag.toUpperCase()) {
					return 1;
				}

				return 0;
			};
			

		};

		/*
		 field 008 chars 00-05, record age, newer is preferred.
		 */
		this.extractRecordAge = function(record) {
			var extractFunc = this.extractControlfieldPosition('008', 0,6);
			return extractFunc(record);
		};

		/**
		 * extracts count characters from index in first controlfield with tag
		 *
		 */
		this.extractControlfieldPosition = function(tag, index, count) {
			count = count || 1;
			return function(record) {
				var field = record.fields.filter(tagFilter(tag)).reduce(firstItem, undefined);
				if (field === undefined) {
					return undefined;
				}
				if (field.value.length < index) {
					return undefined;
				}
				return field.value.substr(index, count);
			};
		};

		this.extractLocalOwnerList = function(record) {

			var localOwnerFields = record.fields.filter(function(field) {
				return field.tag === 'LOW' || field.tag === 'SID';
			});

			var localOwnerOrganizations = localOwnerFields.map(function(field) {
				if (field.tag === 'LOW') {
					var a_subfields = field.subfields.filter(function(f) { return f.code === 'a';});

					if (a_subfields.length) {
						return a_subfields[0].value;
					}
				}
				if (field.tag === 'SID') {
					var b_subfields = field.subfields.filter(function(f) { return f.code === 'b';});
					if (b_subfields.length) {
						return b_subfields[0].value;
					}
				}
				return undefined;
			});

			localOwnerOrganizations = localOwnerOrganizations.reduce(function(memo, item) {
				
				if (item !== undefined && item !== null) {
					memo.push(item);
				}
				return memo;
			}, []);

			localOwnerOrganizations = localOwnerOrganizations.map(function(str) { 
				return str.toUpperCase();
			});
			return arrayUniques(localOwnerOrganizations);
		};

		/*
		Local owner count

			returns [0,n]
		 */
		this.extractLocalOwnerCount = function(record) {
			return this.extractLocalOwnerList(record).length;
		};

		function arrayUniques(arr) {
			return arr.reduce(function(memo, item) {
				if (memo.indexOf(item) === -1) {
					memo.push(item);
				}
				return memo;
			}, []);
		}

		this.extractFieldCount = function(tag, arrayOfSubfields) {
			return function(record) {

				var count = 0;
				record.fields.forEach(function(field) {
					if (field.tag === tag) {

						if (arrayOfSubfields !== undefined) {

							field.subfields.forEach(function(subfield) {
								if (arrayOfSubfields.indexOf(subfield.code) !== -1) {
									count++;
								}
							});
						} else {
							count++;
						}
					}
				});

				return count;
			};

		};

		/*
		 Extract specific field value from record
		 Example usage is:
		  Field 040 has in it's subfield [a,d] value: FI-NL
		  Field 040 has in it's subfield [a,d] value: FI-Fenn
		  Field 040 has in it's subfield [a] value: finb

		  returns [0,1]
		 */
		this.extractSpecificFieldValue = function(tag, arrayOfSubfields, lookupValues) {
			return function(record) {

				var found = false;
				record.fields.forEach(function(field) {
					if (field.tag === tag) {
						field.subfields.forEach(function(subfield) {
							if (arrayOfSubfields.indexOf(subfield.code) !== -1 &&
								lookupValues.indexOf(subfield.value) !== -1) {
								found = true;
							}
						});
					}
				});

				return found ? 1 : 0;
			};
		};

		/*
		 Extract field length from record
		 If the record has multiple fields with given tag, returns sum of each fields lengths.

		  returns [0,n]
		 */
		this.extractFieldLength = function(tag) {
			return function(record) {

				var length = 0;
				record.fields.forEach(function(field) {
					if (field.tag === tag) {
						if (field.subfields) {
							field.subfields.forEach(function(subfield) {
								length += subfield.value.length;
							});
						
						} else {
							length += field.value.length;
						}
					}
				});

				return length;
			};
		};

		this.extractSpecificLocalOwner = function(localOwnerTag) {
			var lowExtractor = this.extractSpecificFieldValue('LOW', ['a'], localOwnerTag.toUpperCase());
			var sidExtractor = this.extractSpecificFieldValue('SID', ['b'], localOwnerTag.toLowerCase());

			return function(record) {
				return lowExtractor(record) || sidExtractor(record);
			};
		};


		/*
		 Latest-change: From CAT with userfilter, defaults to 005 if there are no CAT fields.

		 returns timestamp in format YYYYMMDDHHmm
		 */
		this.extractLatestChange = function(humanUsernameCheckFunction) {
			return function(record) {

				var changeLog = record.fields.filter(tagFilter('CAT')).map(function(field) {
					
					var sub_a = field.subfields.filter(codeFilter('a')).reduce(firstItem, undefined);
					var sub_c = field.subfields.filter(codeFilter('c')).reduce(firstItem, undefined);
					var sub_h = field.subfields.filter(codeFilter('h')).reduce(firstItem, undefined);

					return {
						user: (sub_a !== undefined) ? sub_a.value : undefined,
						date: (sub_c !== undefined) ? sub_c.value : '0000',
						time: (sub_h !== undefined) ? sub_h.value : '0000'
					};

				});

				var humanChangeLog = changeLog.filter(function(changeEntry) {
					if (humanUsernameCheckFunction === undefined) { 
						return true;
					}

					return humanUsernameCheckFunction(changeEntry.user);
				});

				// sort in descending order by date
				humanChangeLog.sort(function(b,a) {

					var dateDiff = parseIntegerProperty(a,'date') - parseIntegerProperty(b,'date');
					if (dateDiff !== 0) {
						return dateDiff;
					}
					return parseIntegerProperty(a,'time') - parseIntegerProperty(b,'time');


					function parseIntegerProperty(obj, propName) {
						return (obj[propName] !== undefined) ? parseInt(obj[propName],10) : 0;
					}
				});

				if (humanChangeLog.length > 0) {
					return humanChangeLog[0].date + humanChangeLog[0].time;

					
				} else {
					//default to field 005
					var f005 = record.fields.filter(tagFilter('005')).reduce(firstItem, undefined);
					return f005.value.substr(0,12);
				}


			};
		};

		function firstItem(memo, item) {
			if (memo === undefined && item !== undefined) {
				memo = item;
			} 
			return memo;
		}

		function codeFilter(code) {
			return function(subfield) {
				return subfield.code === code;
			};
		}

		function tagFilter(tag) {
			return function(field) {
				return field.tag === tag;
			};
		}



	}
	return PreferredRecordSelector;
	
}));

