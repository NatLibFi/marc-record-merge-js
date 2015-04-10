//mergeutils melinda

(function(root, factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define(['q'], factory);
	} else if(typeof exports === 'object') {
		module.exports = factory(require('q'));  // jshint ignore:line
	} else {
		root.merge = factory(root.Q);
	}
}(this, function(Q) {
	"use strict";

	function applyPreMergeModifications(otherRecord, preferredRecord) {


	}

	/**
	 *
	 *  Checks whether 2 records can be merged, returns an object:
	 *  
	 *  {
	 *	  mergePossible: true|false,
	 *	  reason: ["if merge is not possible, the reason(s) for it"]
	 *	}
	 *
	 */
	function canMerge(otherRecord, preferredRecord) {
		// Check that there aren't any LOW tags with same library-id.
		

		return {
			mergePossible: true
		};
	}

	function applyPostMergeModifications(otherRecord, preferredRecord, mergedRecord) {
		// Handle low tags by moving them from "otherRecord" to mergedRecord
		//  and then creating SID links to both preferred and other record
	
		var LOW_fields = otherRecord.fields.filter(byTag('LOW'));
		
		var other_id = findId(otherRecord);
		mergedRecord.fields = mergedRecord.fields.concat(LOW_fields);
		LOW_fields.forEach(function(field) {

			var libraryId = getSubfieldContent(field, 'a');
			if (libraryId === undefined) {
				return;
			}

			var SID_fields = recordHasSid(otherRecord, libraryId);

			if (SID_fields.length > 0) {

				SID_fields.forEach(function(field) {
					mergedRecord.fields.push(field);
				});
				
				return;
			}

			mergedRecord.fields.push({
				tag: 'SID',
				subfields: [
					{ code: 'c', value:'FCC' + other_id },
					{ code: 'b', value: libraryId.toLowerCase() },					
				]
			});
		});

		// Now make sid links from preferred record to merged too.
		LOW_fields = preferredRecord.fields.filter(byTag('LOW'));
		var preferred_id = findId(preferredRecord);
		LOW_fields.forEach(function(field) {

			var libraryId = getSubfieldContent(field, 'a');
			if (libraryId === undefined) {
				return;
			}

			var SID_fields = recordHasSid(preferredRecord, libraryId);

			if (SID_fields.length > 0) {

				// because preferred record is used as base, any sid fields are already in the merged one.
				
				return;
			}

			mergedRecord.fields.push({
				tag: 'SID',
				subfields: [
					{ code: 'c', value:'FCC' + preferred_id },
					{ code: 'b', value: libraryId.toLowerCase() },					
				]
			});
		});

		// Handle 035 tags by creating a,z fields to mergedRecrod from other and preferred records
		mergedRecord.fields.push({
				tag: '035',
				subfields: [
					{ code: 'z', value:'(FI-MELINDA)' + other_id },
				]
		});
		
		mergedRecord.fields.push({
				tag: '035',
				subfields: [
					{ code: 'z', value:'(FI-MELINDA)' + preferred_id },
				]
		});

		// Remove bib-id from mergedRecord 001, because we are going to save it as new
		mergedRecord.fields = mergedRecord.fields.filter(function(field) {
			return field.tag !== "001";
		});
		mergedRecord.fields.push({
			tag: '001',
			value: '000000000'
		});

		// add 583 field with comments about merge operation.
		
		mergedRecord.fields.push({
				tag: '583',
				subfields: [
					{ code: 'a', value:'MERGED FROM ' + other_id + " + " + preferred_id },
					{ code: '5', value:'MELINDA' },
					{ code: 'c', value: formatDate(new Date()) },
				]
		});

		// 780 + fenni<keep> drop thing
		// 
		// 
		// 
		

		mergedRecord.fields.sort(fieldSorter);
	}

	var fieldOrder = {
		"FMT": 0,
		"LOW": 997,
		"SID": 998,
		"CAT": 999
	};

	function sortByStringSubfieldArray(subfieldArray, field1, field2) {

		var t1 = field1.subfields.filter(toSubs).map(toVal).join('');
		var t2 = field2.subfields.filter(toSubs).map(toVal).join('');
		
		if (t1 > t2) {
			return 1;
		} 
		if (t2 > t1) {
			return -1;
		}
		return 0;

		function toSubs(f) {
			return subfieldArray.indexOf(f.code) !== -1;
		}
		function toVal(sub) {
			return sub.value;
		}
	}
	function sortByIntegerSubfieldArray(subfieldArray, field1, field2) {
		var t1 = field1.subfields.filter(toSubs).map(toVal).join('');
		var t2 = field2.subfields.filter(toSubs).map(toVal).join('');
		
		return parseInt(t1) - parseInt(t2);

		function toSubs(f) {
			return subfieldArray.indexOf(f.code) !== -1;
		}
		function toVal(sub) {
			return sub.value;
		}
	}

	function fieldSorter(f1, f2) {
		if (f1.tag === "CAT" && f2.tag === "CAT") {
			return sortByIntegerSubfieldArray(['c','h'], f1, f2);
		}
		if (f1.tag === "LOW" && f2.tag === "LOW") {
			return sortByStringSubfieldArray(['a'], f1, f2);
		}
		if (f1.tag === "SID" && f2.tag === "SID") {
			return sortByStringSubfieldArray(['b'], f1, f2);
		}

		var tag1 = fieldOrder[f1.tag] || parseInt(f1.tag);
		var tag2 = fieldOrder[f2.tag] || parseInt(f2.tag);

		return tag1-tag2;
	}

	function formatDate(date) {
	    var tzo = -date.getTimezoneOffset();
	    var dif = tzo >= 0 ? '+' : '-';

	    return date.getFullYear() +
	        '-' + pad(date.getMonth()+1) +
	        '-' + pad(date.getDate()) +
	        'T' + pad(date.getHours()) +
	        ':' + pad(date.getMinutes()) +
	        ':' + pad(date.getSeconds()) +
	        dif + pad(tzo / 60) +
	        ':' + pad(tzo % 60);

	    function pad(num) {
    		var str = num.toString();
    		while(str.length < 2) {
    			str = "0" + str;
    		}
    		return str;
	    }
	}

	function recordHasSid(record, libraryId) {

		var SID_fields = record.fields.filter(bySubfieldValue('SID', 'b', libraryId.toLowerCase()));
		
		return SID_fields;
	}

	function byTag(tag) {
		return function(field) {
			return field.tag == tag;
		};
	}

	function bySubfieldValue(tag, code, value) {
		return function(field) {
			if (field.tag !== tag) { return false; }

			if (field.subfields === undefined) { return false; }

			for (var i=0;i<field.subfields.length;i++) {
				if (field.subfields[i].code === code && field.subfields[i].value === value) {
					return true;
				}
			}
			return false;

		};
	}

	function getSubfieldContent(field, code) {
		var subfields = field.subfields.filter(function(subfield) {
			return subfield.code == code;
		});
		if (subfields.length > 1) {
			throw new Error("Found multiple subfields with code " + code);
		}
		if (subfields.length < 1) {
			return undefined;
		}
		return subfields[0].value;
	}
	function findId(record) {
		var f001 = record.fields.filter(byTag("001"));
		if (f001.length === 0) {
			throw new Error("Could not parse record id");
		}
		return f001[0].value;

	}

	return {
		applyPreMergeModifications: applyPreMergeModifications,
		canMerge: canMerge,
		applyPostMergeModifications: applyPostMergeModifications
	};

}));