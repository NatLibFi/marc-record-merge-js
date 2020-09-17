/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Merge MARC records
*
* Copyright (C) 2015-2019 University Of Helsinki (The National Library Of Finland)
*
* This file is part of marc-record-merge-js

* marc-record-merge-js program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* marc-record-merge-js is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/
import createDebugLogger from 'debug';
import {normalizeSync} from 'normalize-diacritics';

export default (pattern) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(pattern);
  const sourceFields = source.get(pattern);
  return selectFields();

  function selectFields() {
    // Check that all fields are data fields
    // Test 01: The field is a control field (contains 'value')
    checkFieldType(baseFields);
    checkFieldType(sourceFields);

    // Test 02: If there are multiple fields, the base field is returned unmodified
    if (baseFields.length > 1 || sourceFields.length > 1) {
      debug(`Multiple fields in base or source`);
      return base;
    }
    // Now that there is only one field in both baseFields and sourceFields, the arrays can be destructured into variables
    const [baseField] = baseFields;
    const [sourceField] = sourceFields;

    // Check that the base and source tags are equal
    // Test 03: Base and source tags are equal for one field (continue to normalization and comparison of contents)
    // Test 04: Base and source tags are not equal (base field returned unmodified)
    // Note: to check this, the pattern has to allow two tags, otherwise the unequal tag does not even pass source.get(pattern)
    if (baseField.tag === sourceField.tag === false) {
      debug(`Tags are not equal`);
      return base;
    }
    const baseSubs = baseField.subfields;
    const sourceSubs = sourceField.subfields;

    // Use .map, destructure code and value, and return a new object which has the same code and a new value for value
    // Test 05: Normalize subfield values (base and source are equal) --> return base
    const baseSubsNormalized = baseSubs.map(({code, value}) => {
      return {code, value: normalizeSubfieldValue(value)}
    });
    debug(`baseSubsNormalized: ${JSON.stringify(baseSubsNormalized, undefined, 2)}`);

    const sourceSubsNormalized = sourceSubs.map(({code, value}) => {
      return {code, value: normalizeSubfieldValue(value)}
    });
    debug(`sourceSubsNormalized: ${JSON.stringify(sourceSubsNormalized, undefined, 2)}`);

    // Compare equality of normalized subfields
    // Test 06: Two subfields, both equal --> return base
    // Test 07: Two subfields, same codes, values of source are subsets of values of base --> return source
    // Test 08: Two subfields, one is a subset, one has a different code --> return base
    // Test 09: Two subfields, same codes, values are not subsets --> return base
    // Test 10: sourceField is a proper superset of baseField (subfields a and b are equal, c is new) --> return source
    // Test 11: sourceField is not a proper superset of baseField (different values in a and b, also new subfield c) --> return base
    // Test 12: sourceField is a proper superset of baseField (base values a and b are subsets of source values a and b, c is new in source) --> return source
    // Test 13: Opposite of test 12, baseField is a proper superset of sourceField --> return base

    // Filter out equal subfields (exactly equal code and value)
    const equalSubs = baseSubsNormalized.filter(compareStrictEquality);
    debug(`equalSubs: ${JSON.stringify(equalSubs, undefined, 2)}`);

    // Subset comparison
    const subsetComparison = baseSubsNormalized.filter(compareSubsets);
    debug(`subsetComparison: ${JSON.stringify(subsetComparison, undefined, 2)}`);

    // About the if blocks below: Can these be under the same block or would it better to divide this into:
    // if (sourceSubsNormalized.length === baseSubsNormalized.length && baseSubsNormalized.length === equalSubs.length)
    // and
    // if (sourceSubsNormalized.length === baseSubsNormalized.length && baseSubsNormalized.length >= equalSubs.length)
    // Or should these also be made into functions?

    // If source and base have the same number of subfields
    if (sourceSubsNormalized.length === baseSubsNormalized.length) {
      // First compare strict equality
      if (baseSubsNormalized.length === equalSubs.length) {
        debug(`All subfields are equal`);
      // If all subfields are equal, return base (or source? does it matter?)
        return base;
      }
      // Then compare subsets of subfield values
      if (baseSubsNormalized.length >= equalSubs.length) {
        //const subsetComparison = baseSubsNormalized.map(compareSubsets);
        if (baseSubsNormalized.length === subsetComparison.length) {
          debug(`All base subfields are subsets of source subfields`);
          return source;
        }
      }
    }

    // If source has more subfields than base (proper superset comparison)
    // (If base has more subfields than source, the case is not separately covered here and the code returns the original base, since it is already better than source)
    if (sourceSubsNormalized.length > baseSubsNormalized.length) {
      // First compare strict equality: all base subfields are equal to some source subfields
      if (baseSubsNormalized.length === equalSubs.length) {
        debug(`Source is a superset of base`);
        debug(`source is: ${JSON.stringify(source, undefined, 2)}`);
        return source;
      }
      // Then compare subsets of subfield values
      if (baseSubsNormalized.length >= equalSubs.length) {
        if (baseSubsNormalized.length === subsetComparison.length) {
          debug(`All base subfields are subsets of source subfields`);
          return source;
        }
      }
    }

    // Functions:

    function checkFieldType(fields) {
      const checkedFields = fields.map(field => {
        // Control fields are not handled here
        if ('value' in field) { // eslint-disable-line functional/no-conditional-statement
          throw new Error('Invalid control field, expected data field');
        }
        // Data fields are passed on
        return field;
      });
      return checkedFields;
    }

    function normalizeSubfieldValue(value) {
      // Regexp options: g: global search, u: unicode
      const punctuation = /[.,\-/#!$%^&*;:{}=_`~()[\]]/gu;
      return normalizeSync(value).toLowerCase().replace(punctuation, '', 'u').replace(/\s+/gu, ' ').trim();
    }

    function compareStrictEquality(baseSubfield) {
      // CompareOneStrict is filled with boolean values for every iteration of the function
      // I.e. every time that one baseSubfield is compared with all sourceSubfields
      const compareOneStrict = sourceSubsNormalized.map(strictEquality);

      function strictEquality(sourceSubfield) {
        // If both subfield codes and values are equal
        if (sourceSubfield.code === baseSubfield.code && sourceSubfield.value === baseSubfield.value) {
          debug(`baseSubfield ${baseSubfield.code} and sourceSubfield ${sourceSubfield.code} are equal`);
          return true;
        }
        debug(`baseSubfield ${baseSubfield.code} and sourceSubfield ${sourceSubfield.code} are NOT equal`);
        return false;
      }
      debug(`compareOneStrict: ${JSON.stringify(compareOneStrict, undefined, 2)}`);
      // If all elements of compareOneStrict are false, the baseSubfield being compared is not equal to any of the sourceSubfields
      // And compareStrictEquality returns false
      if (compareOneStrict.every(element => element === false)) {
        return false;
      }
      // If compareOneStrict has at least one element that is true, the baseSubfield being compared is equal to one of the sourceSubfields
      // And compareStrictEquality returns true
      return true;
    }

    function compareSubsets(baseSubfield) {
      const compareOneSubset = sourceSubsNormalized.map(compareSubfieldValues);

      function compareSubfieldValues(sourceSubfield) {
        // If subfield codes are equal and all base subfield values are subsets of source subfield values
        if (sourceSubfield.code === baseSubfield.code && sourceSubfield.value.indexOf(baseSubfield.value) !== -1) {
          debug(`${baseSubfield.value} is a subset of ${sourceSubfield.value}`);
          return true;
        }
        debug(`${baseSubfield.value} is NOT a subset of ${sourceSubfield.value}`);
        return false;
      }
      debug(`compareOneSubset: ${JSON.stringify(compareOneSubset, undefined, 2)}`);
      // If all elements of compareOneSubset are false, the baseSubfield being compared is not a subset of any of the sourceSubfields
      // And compareSubsets returns false
      if (compareOneSubset.every(element => element === false)) {
        return false;
      }
      // If compareOneSubset has at least one element that is true, the baseSubfield being compared is a subset of one of the sourceSubfields
      // And compareSubsets returns true
      return true;
    }
    // If none of these cases apply, return the original base
    debug(`Return original base`);
    return base;
  }
};

