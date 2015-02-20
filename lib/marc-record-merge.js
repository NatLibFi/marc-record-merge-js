
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

	// Array.prototype.find polyfill
	if (!Array.prototype.find) {
	  Array.prototype.find = function(predicate) {
	    if (this == null) {
	      throw new TypeError('Array.prototype.find called on null or undefined');
	    }
	    if (typeof predicate !== 'function') {
	      throw new TypeError('predicate must be a function');
	    }
	    var list = Object(this);
	    var length = list.length >>> 0;
	    var thisArg = arguments[1];
	    var value;

	    for (var i = 0; i < length; i++) {
	      value = list[i];
	      if (predicate.call(thisArg, value, i, list)) {
	        return value;
	      }
	    }
	    return undefined;
	  };
	}


	function Merger(config) {

		var tagSortIndex = {
			SID: 995,
			CAT: 996,
			LOW: 997
		};

		function preferenceOrder(record1, record2) {
			return [record1, record2];
		}

		function merge(record1, record2) {

			var deferred = Q.defer();

			// Determine preferred record
			var preference = preferenceOrder(record1, record2);

			var preferred = preference[0];
			var other = preference[1];

			// merge fields
			
			var merged = clone(preferred);
			merged.fields.forEach(function(field) {
				field.wasUsed = true;
				field.fromPreferred = true;
			});

			other.fields.forEach(function(field) {

				// is configured to be moved?
				
				// findPair from preferred record
				
				var pairField = merged.fields.find(fieldsSimilar.bind(this, field));

				if (pairField === undefined) {
					
					field.wasUsed = true;
					field.fromOther = true;
					merged.fields.push(field);

				} else {
					// determine which one to use, this or preferred records field
				
				
					// Addiotionally/optionally copy possible subfields, if configured. 
				}
				
			});

			merged.fields.sort(MARCRecordFieldSorter);

			deferred.resolve(merged);

			return deferred.promise;

		}

		function fieldsSimilar(field1, field2) {
		
			if (field1.tag !== field2.tag) {
				return false;
			}

			if (field1.ind1 !== field2.ind1) {
				return false;
			}

			if (field1.ind2 !== field2.ind2) {
				return false;
			}

			if (field1.subfields && field2.subfields) {
				if (!subfieldsSimilar(field1.subfields, field2.subfields)) {
					return false;
				}
			} else {
				if (field1.value !== field2.value) {
					return false;
				}
			}
			return true;

		}

		function subfieldsSimilar(subfieldArray1, subfieldArray2) {
		
			var similar = true;
			subfieldArray1.forEach(function(subfield, idx) {
				var other = subfieldArray2[idx];
				if (other === undefined) {
					similar = false;
					return;
				}
				
				if (subfield.code !== other.code) {
					similar = false;
				}
				if (subfield.value !== other.value) {
					similar = false;
				}
				
			});
			return similar;

		}

		function sortIndex(tag) {
			return (tagSortIndex[tag] ? tagSortIndex[tag] : parseInt(tag,10) );
		}

		function MARCRecordFieldSorter(a,b) {
			return sortIndex(a.tag) - sortIndex(b.tag);
		}

		function clone(obj) {
			return JSON.parse(JSON.stringify(obj));
		}

		return {
			merge: merge
		};
	}

	return Merger;

}));