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
    // Debug(`baseField destructured: ${JSON.stringify(baseField, undefined, 2)}`);
    const [sourceField] = sourceFields;
    // Debug(`sourceField destructured: ${JSON.stringify(sourceField, undefined, 2)}`);

    // Check that the base and source tags are equal
    // Test 03: Base and source tags are equal for one field (continue to comparison of contents)
    // Test 04: Base and source tags are not equal (base field returned unmodified)
    // Note: to check this, the pattern has to allow two tags, otherwise the unequal tag does not even pass source.get(pattern)
    if (baseField.tag === sourceField.tag === false) {
      debug(`Tags are not equal`);
      return base;
    }
    const baseSubs = baseField.subfields;
    const sourceSubs = sourceField.subfields;

    // Test 05: Normalize subfield values
    baseSubs.forEach(normalizeSubfieldValue);
    debug(`baseField normalized: ${JSON.stringify(baseField, undefined, 2)}`);
    sourceSubs.forEach(normalizeSubfieldValue);
    debug(`sourceField normalized: ${JSON.stringify(sourceField, undefined, 2)}`);

    // Compare equality of normalized subfields
    // Test 06: Two subfields, both equal
    // Test 07: Two subfields, same codes, values are mutual subsets
    // Test 08: Two subfields, one is a subset, one has a different code
    // Test 09: Two subfields, same codes, values are not subsets
    // Test 10: sourceField is a proper superset of baseField (subfields a and b are equal, c is new)
    // Test 11: sourceField is not a proper superset of baseField (different values in a and b, also new subfield c)
    // Test 12: sourceField is not a proper superset of baseField (subfield a is equal, b is different, also new subfield c)

    // First compare strict equality (default)
    // This does not modify anything, base is returned at the end
    // (Is this step even necessary since the original base is returned unmodified anyway?)
    // BaseSubs.forEach(compareStrictEquality);
    // Debug(`baseField after compareStrictEquality: ${JSON.stringify(baseField, undefined, 2)}`);

    // If source has more subfields than base
    if (sourceSubs.length > baseSubs.length) {
      // And if strict equality is true for all base subfields
      // The result array is filled with compareStrictEquality return values
      // And if they are all true, it means that source has equal subfields to all base subfields
      const result = baseSubs.map(compareStrictEquality);
      debug(`result: ${JSON.stringify(result, undefined, 2)}`);
      if (result.every(element => element === true)) {
        // Source is returned since it contains all of base and more
        debug(`Source is a superset of base`);
        return source;
      }
      // If source is not a proper superset of base, return the original unmodified base
      // In this case the result array contains at least one element that is false
      debug(`Source is NOT a superset of base`);
      return base;
    }

    // Compare subsets of subfield values
    // This modifies base subfield values, base is returned at the end
    baseSubs.forEach(compareSubsets);
    debug(`baseField after compareSubsets: ${JSON.stringify(baseField, undefined, 2)}`);

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

    function normalizeSubfieldValue(subfield) {
      // Regexp options: g: global search, u: unicode
      const punctuation = /[.,\-/#!$%^&*;:{}=_`~()[\]]/gu;
      /* eslint-disable */
      subfield.value = normalizeSync(subfield.value);
      subfield.value = subfield.value.toLowerCase();
      subfield.value = subfield.value.replace(/\s+/gu, ' ').trim();
      subfield.value = subfield.value.replace(punctuation, '', 'u').replace(/\s+/gu, ' ').trim();
      /* eslint-enable */
      return subfield;
    }

    function compareStrictEquality(baseSubfield) {
      // TrueArray is filled with boolean values for every iteration of the function
      // I.e. every time that one baseSubfield is compared with all sourceSubfields
      const trueArray = sourceSubs.map(strictEquality);

      function strictEquality(sourceSubfield) {
        // Debug(`baseSubfield.code is ${JSON.stringify(baseSubfield.code, undefined, 2)}`);
        // Debug(`baseSubfield.value is ${JSON.stringify(baseSubfield.value, undefined, 2)}`);
        // Debug(`sourceSubfield.code is ${JSON.stringify(sourceSubfield.code, undefined, 2)}`);
        // Debug(`sourceSubfield.value is ${JSON.stringify(sourceSubfield.value, undefined, 2)}`);
        // If both subfield codes and values are equal
        if (sourceSubfield.code === baseSubfield.code && sourceSubfield.value === baseSubfield.value) {
          debug(`baseSubfield ${baseSubfield.code} and sourceSubfield ${sourceSubfield.code} are equal`);
          // Since the values are equal, either could be assigned as the new value
          // This assignment is not even necessary since baseSubfield keeps its old value
          // But it may be more clear to read like this than having just an empty if block
          baseSubfield.value = baseSubfield.value; // eslint-disable-line
          return true;
        }
        debug(`baseSubfield ${baseSubfield.code} and sourceSubfield ${sourceSubfield.code} are NOT equal`);
        return false;
      }
      debug(`trueArray: ${JSON.stringify(trueArray, undefined, 2)}`);
      // If all elements of trueArray are false, the baseSubfield being compared is not equal to any of the sourceSubfields
      // And compareStrictEquality returns false
      if (trueArray.every(element => element === false)) {
        return false;
      }
      // If trueArray has at least one element that is true, the baseSubfield being compared is equal to one of the sourceSubfields
      // And compareStrictEquality returns true
      return true;
    }

    function compareSubsets(baseSubfield) {
      sourceSubs.forEach(compareSubfieldValues);

      function compareSubfieldValues(sourceSubfield) {
        // If subfield codes are equal but values are not, compare the values
        if (sourceSubfield.code === baseSubfield.code && sourceSubfield.value !== baseSubfield.value) {
          // Check whether one value is a subset of the other and use the longer=better value
          if (sourceSubfield.value.indexOf(baseSubfield.value) !== -1) {
            debug(`${baseSubfield.value} is a subset of ${sourceSubfield.value}`);
            baseSubfield.value = sourceSubfield.value; // eslint-disable-line
            return;
          }
          if (baseSubfield.value.indexOf(sourceSubfield.value) !== -1) {
            debug(`${sourceSubfield.value} is a subset of ${baseSubfield.value}`);
            // Same as above, keep this for clarity
            baseSubfield.value = baseSubfield.value; // eslint-disable-line
            return;
          }
          // If neither value is a subset of the other, use the longer string
          if (baseSubfield.value.length >= sourceSubfield.value.length) {
            debug(`${baseSubfield.value} is longer or the values are equally long`);
            baseSubfield.value = baseSubfield.value; // eslint-disable-line
            return;
          }
          if (sourceSubfield.value.length > baseSubfield.value.length) {
            debug(`${sourceSubfield.value} is longer`);
            baseSubfield.value = sourceSubfield.value; // eslint-disable-line
            // For some reason, if this last line just has "return;", it disappears when I run npm run test:dev and then I get an error message about "incomplete branch".
            // "return true;" seems to be acceptable to test:dev even though the return value is not actually used anywhere
            return true;
          }
        }
      }
    }
    return base; // The (possibly modified) base is returned by selectFields as mergedRecord
  }
};

