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

// The equalityFunction can be either strictEquality or subsetEquality
// Returns true or false
export function strictEquality(subfieldA, subfieldB) {
  return subfieldA.code === subfieldB.code &&
  subfieldA.value === subfieldB.value;
}

export function subsetEquality(subfieldA, subfieldB) {
  // eslint error message: Unexpected mix of '&&' and '||'
  /* eslint-disable */
  return subfieldA.code === subfieldB.code &&
  subfieldA.value.indexOf(subfieldB.value) !== -1 || subfieldB.value.indexOf(subfieldA.value) !== -1;
  /* eslint-enable */
}

export default ({pattern, equalityFunction = strictEquality}) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(pattern);
  const sourceFields = source.get(pattern);
  return selectFields();

  function selectFields() {
    // Check that all fields are data fields
    // Test 01: The field is a control field (contains 'value') --> error message
    checkFieldType(baseFields);
    checkFieldType(sourceFields);

    // Test 02: If there are multiple fields, return base
    if (baseFields.length > 1 || sourceFields.length > 1) {
      debug(`Multiple fields in base or source`);
      return base;
    }
    // Now that there is only one field in both baseFields and sourceFields, the arrays can be destructured into variables
    const [baseField] = baseFields;
    const [sourceField] = sourceFields;

    // Check that the base and source tags are equal
    // Test 03: Base and source tags are equal for one field --> return base)
    // Test 04: Base and source tags are not equal --> return base
    // Note: to check this, the pattern has to allow two tags, otherwise the unequal tag does not even pass source.get(pattern)
    if (baseField.tag === sourceField.tag === false) {
      debug(`Tags are not equal`);
      return base;
    }
    const baseSubs = baseField.subfields;
    const sourceSubs = sourceField.subfields;

    // Use .map, destructure code and value, and return a new object which has the same code and a new value for value
    // Test 05: Normalize subfield values (base and source are equal) --> return base
    const baseSubsNormalized = baseSubs.map(({code, value}) => ({code, value: normalizeSubfieldValue(value)}));
    // Debug(`baseSubsNormalized: ${JSON.stringify(baseSubsNormalized, undefined, 2)}`);

    const sourceSubsNormalized = sourceSubs.map(({code, value}) => ({code, value: normalizeSubfieldValue(value)}));
    // Debug(`sourceSubsNormalized: ${JSON.stringify(sourceSubsNormalized, undefined, 2)}`);

    // Compare equality of normalized subfields
    // Test 06: Two subfields, both equal --> return base
    // Test 07: Two subfields, same codes, values of source are subsets of values of base --> replaceBasefieldWithSourcefield
    // Test 08: Two subfields, one is a subset, one has a different code --> return base
    // Test 09: Two subfields, same codes, values are not subsets --> return base
    // Test 10: sourceField is a proper superset of baseField (subfields a and b are equal, c is new) --> replaceBasefieldWithSourcefield
    // Test 11: sourceField is not a proper superset of baseField (different values in a and b, also new subfield c) --> return base
    // Test 12: sourceField is a proper superset of baseField (base values a and b are subsets of source values a and b, c is new in source) --> replaceBasefieldWithSourcefield
    // Test 13: Opposite of test 12, baseField is a proper superset of sourceField --> return base

    // Equality comparison
    // Returns the base subfields for which a matching source subfield is found
    const equalSubfieldsBase = baseSubsNormalized.filter(baseSubfield => sourceSubsNormalized.some(sourceSubfield => equalityFunction(baseSubfield, sourceSubfield)));
    debug(`equalSubfieldsBase: ${JSON.stringify(equalSubfieldsBase, undefined, 2)}`);

    // Returns the source subfields for which a matching base subfield is found
    const equalSubfieldsSource = sourceSubsNormalized.filter(sourceSubfield => baseSubsNormalized.some(baseSubfield => equalityFunction(sourceSubfield, baseSubfield)));
    debug(`equalSubfieldsSource: ${JSON.stringify(equalSubfieldsSource, undefined, 2)}`);

    // Subset comparison
    // Returns the base subfields for which base subfield values are subsets of source subfield values
    // In this case source is better
    const equalSubsetsBase = baseSubsNormalized.filter(baseSubfield => sourceSubsNormalized.some(sourceSubfield => equalityFunction(baseSubfield, sourceSubfield)));
    debug(`equalSubsetsBase: ${JSON.stringify(equalSubsetsBase, undefined, 2)}`);

    // Returns the source subfields for which source subfield values are subsets of base subfield values
    // In this case base is better
    const equalSubsetsSource = sourceSubsNormalized.filter(sourceSubfield => baseSubsNormalized.some(baseSubfield => equalityFunction(sourceSubfield, baseSubfield)));
    debug(`equalSubsetsSource: ${JSON.stringify(equalSubsetsSource, undefined, 2)}`);

    // How many equal subfields are there in source for base and vice versa

    // If the number of equal subfields is less than the number of original base subfields
    // (there is the same number of subfields in base and source, but they are not equal, test case 08)
    // Return original base
    if (baseSubs.length === sourceSubs.length && equalSubfieldsBase.length < baseSubs.length) {
      debug(`Subfields are not equal`);
      return base;
    }

    // Both base and source have the same number of subfields
    if (baseSubs.length === sourceSubs.length && equalSubfieldsBase.length === equalSubfieldsSource.length) {
      debug(`Testing for equal subfields`);
      // Calculate the number of characters in each normalized subfield values and sum them.
      // The field that has a larger value is selected.
      const totalSubfieldLengthBase = baseSubsNormalized
        .map(({value}) => value.length)
        .reduce((acc, value) => acc + value);
      const totalSubfieldLengthSource = sourceSubsNormalized
        // Destructure subfield value to get length and sum up lengths with reduce
        .map(({value}) => value.length)
        .reduce((acc, value) => acc + value);

      if (totalSubfieldLengthBase >= totalSubfieldLengthSource) {
        debug(`Base is better`);
        return base;
      }
      if (totalSubfieldLengthSource > totalSubfieldLengthBase) {
        debug(`Source is better`);
        return replaceBasefieldWithSourcefield(base);
      }
    }

    // Otherwise check supersets
    // Source is longer = has more subfields and all base subfields are found in source
    if (sourceSubs.length > baseSubs.length && baseSubs.length === equalSubsetsBase.length) {
      debug(`Source is a superset of base`);
      return replaceBasefieldWithSourcefield(base);
    }

    // If none of the above conditions are fulfilled, return the original base
    debug(`Returning original base`);
    return base;

    // Functions:

    // If source is better, replace the old field in base with the new field from source
    // This function modifies the base record, so eslint is disabled here
    function replaceBasefieldWithSourcefield(base) {
      const index = base.fields.findIndex(field => field === baseField);
      base.removeField(baseField);
      base.fields.splice(index, 0, sourceField); // eslint-disable-line functional/immutable-data
      debug(`Base after replacement: ${JSON.stringify(base, undefined, 2)}`);
      return base;
    }

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
  }
};
