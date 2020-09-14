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
import clonedeep from 'lodash/clonedeep';

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
    debug(`baseSubs: ${JSON.stringify(baseSubs, undefined, 2)}`);
    const sourceSubs = sourceField.subfields;
    debug(`sourceSubs: ${JSON.stringify(baseSubs, undefined, 2)}`);

    // Test 05: Normalize subfield values (base and source are equal) --> return base
    // Use clonedeep to make independent copies of the baseSubs and sourceSubs arrays
    // These copies can be modified by normalization without affecting the original base and source
    const baseSubsNormalized = clonedeep(baseSubs);
    baseSubsNormalized.forEach(normalizeSubfieldValue);
    debug(`baseSubsNormalized: ${JSON.stringify(baseSubsNormalized, undefined, 2)}`);
    debug(`base after baseSubsNormalized: ${JSON.stringify(base, undefined, 2)}`);
    const sourceSubsNormalized = clonedeep(sourceSubs);
    sourceSubsNormalized.forEach(normalizeSubfieldValue);
    debug(`sourceSubsNormalized: ${JSON.stringify(sourceSubsNormalized, undefined, 2)}`);
    debug(`source after sourceSubsNormalized: ${JSON.stringify(source, undefined, 2)}`);

    // Compare equality of normalized subfields
    // Test 06: Two subfields, both equal --> return base
    // Test 07: Two subfields, same codes, values of source are subsets of values of base --> return source
    // Test 08: Two subfields, one is a subset, one has a different code --> return base
    // Test 09: Two subfields, same codes, values are not subsets --> return base
    // Test 10: sourceField is a proper superset of baseField (subfields a and b are equal, c is new) --> return source
    // Test 11: sourceField is not a proper superset of baseField (different values in a and b, also new subfield c) --> return base
    // Test 12: sourceField is a proper superset of baseField (base values a and b are subsets of source values a and b, c is new in source) --> return source

    // First check if source has more subfields than base
    if (sourceSubsNormalized.length > baseSubsNormalized.length) {
      // And if strict equality is true for all base subfields
      // The compareAllSubfields array is filled with compareStrictEquality return values
      // And if they are all true, it means that source has equal subfields to all base subfields
      const compareAllSubfields = baseSubsNormalized.map(compareStrictEquality);
      debug(`compareAllSubfields: ${JSON.stringify(compareAllSubfields, undefined, 2)}`);
      if (compareAllSubfields.every(element => element === true)) {
        // Source is returned since it contains all of base and more
        debug(`Source is a superset of base`);
        return source;
      }
      // If source is not a proper superset of base, return the original unmodified base
      // In this case the compareAllSubfields array contains at least one element that is false
      debug(`Source is NOT a superset of base`);
      return base;
    }

    // If source does not have more subfields than base, compare strict equality (default)
    const strictEqualityComparison = baseSubsNormalized.map(compareStrictEquality);
    debug(`strictEqualityComparison: ${JSON.stringify(strictEqualityComparison, undefined, 2)}`);
    if(strictEqualityComparison.every(element => element === true)) {
      debug(`All subfields are equal`);
      debug(`base is: ${JSON.stringify(base, undefined, 2)}`);
      return base;
    }
    // Then compare subsets of subfield values
    if(strictEqualityComparison.some(element => element === false)) {
      debug(`in subset comparison`);
      baseSubsNormalized.forEach(compareSubsets);
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

    function normalizeSubfieldValue(subfield) {
      // Regexp options: g: global search, u: unicode
      const punctuation = /[.,\-/#!$%^&*;:{}=_`~()[\]]/gu;
      subfield.value = normalizeSync(subfield.value);
      subfield.value = subfield.value.toLowerCase();
      subfield.value = subfield.value.replace(/\s+/gu, ' ').trim();
      subfield.value = subfield.value.replace(punctuation, '', 'u').replace(/\s+/gu, ' ').trim();
      return subfield;
    }

    function compareStrictEquality(baseSubfield) {
      // compareOneSubfield is filled with boolean values for every iteration of the function
      // I.e. every time that one baseSubfield is compared with all sourceSubfields
      const compareOneSubfield = sourceSubsNormalized.map(strictEquality);

      function strictEquality(sourceSubfield) {
        // If both subfield codes and values are equal
        if (sourceSubfield.code === baseSubfield.code && sourceSubfield.value === baseSubfield.value) {
          debug(`baseSubfield ${baseSubfield.code} and sourceSubfield ${sourceSubfield.code} are equal`);
          return true;
        }
        debug(`baseSubfield ${baseSubfield.code} and sourceSubfield ${sourceSubfield.code} are NOT equal`);
        return false;
      }
      debug(`compareOneSubfield: ${JSON.stringify(compareOneSubfield, undefined, 2)}`);
      // If all elements of compareOneSubfield are false, the baseSubfield being compared is not equal to any of the sourceSubfields
      // And compareStrictEquality returns false
      if (compareOneSubfield.every(element => element === false)) {
        return false;
      }
      // If compareOneSubfield has at least one element that is true, the baseSubfield being compared is equal to one of the sourceSubfields
      // And compareStrictEquality returns true
      return true;
    }

    function compareSubsets(baseSubfield) {
      debug(`in compareSubsets`);
      const comparisonArray = sourceSubsNormalized.map(compareSubfieldValues);
      debug(`comparisonArray: ${JSON.stringify(comparisonArray, undefined, 2)}`);
      if (comparisonArray.every(element => element === 'source')) {
        debug(`return source`);
        return source;
      }
      if (comparisonArray.every(element => element === 'base')) {
        debug(`return base`);
        return base;
      }
      // If one field's subfields are not subsets of the other field's subfields, return the original base
      debug(`no subsets found`);
      return base;

      function compareSubfieldValues(sourceSubfield) {
        debug(`in compareSubfieldValues`);
        // If subfield codes are equal but values are not, compare the values
        if (sourceSubfield.code === baseSubfield.code && sourceSubfield.value !== baseSubfield.value) {
          // Check whether the values of all subfields in either base or source are subsets of the other
          // and return the field with the longer=better values
          if (sourceSubfield.value.indexOf(baseSubfield.value) !== -1) {
            debug(`${baseSubfield.value} is a subset of ${sourceSubfield.value}`);
            return 'source';
          }
          if (baseSubfield.value.indexOf(sourceSubfield.value) !== -1) {
            debug(`${sourceSubfield.value} is a subset of ${baseSubfield.value}`);
            return 'base';
          }
        }
      }
    }
    // If none of these cases apply, return the original base
    debug(`way at the end`);
    return base;
  }
};

