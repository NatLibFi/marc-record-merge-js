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
/**
 * Test 01: The field is a control field (contains 'value') --> error message
 * Test 02: If there are multiple fields, return base
 * Test 03: Base and source tags are equal for one field --> return base
 * Test 04: Base and source tags are not equal --> return base
 *  Note: to test for this, tagPattern has to allow two tags,
 *  otherwise the unequal tag does not even pass source.get(tagPattern)
 * Test 05: Normalize subfield values (base and source are equal) --> return base
 * Test 06: Two subfields, both equal --> return base
 * Test 07: Two subfields, same codes, values of source are subsets of values of base --> replaceBasefieldWithSourcefield
 * Test 08: Two subfields, one is a subset, one has a different code --> return base
 * Test 09: Two subfields, same codes, values are not subsets --> return base
 * Test 10: sourceField is a proper superset of baseField (subfields a and b are equal, c is new) --> replaceBasefieldWithSourcefield
 * Test 11: sourceField is not a proper superset of baseField (different values in a and b, also new subfield c) --> return base
 * Test 12: sourceField is a proper superset of baseField (base values a and b are subsets of source values a and b, c is new in source) --> replaceBasefieldWithSourcefield
 * Test 13: Opposite of test 12, baseField is a proper superset of sourceField --> return base
 * Test 14: Normalization test with Cyrillic characters
 */

import {normalizeSync} from 'normalize-diacritics';
import createDebugLogger from 'debug';

export function strictEquality(subfieldA, subfieldB) {
  return subfieldA.code === subfieldB.code &&
  subfieldA.value === subfieldB.value;
}

export function subsetEquality(subfieldA, subfieldB) {
  return subfieldA.code === subfieldB.code &&
  (subfieldA.value.indexOf(subfieldB.value) !== -1 || subfieldB.value.indexOf(subfieldA.value) !== -1);
}
// EqualityFunction can be either strictEquality or subsetEquality
export default ({tagPattern, equalityFunction = strictEquality}) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(tagPattern);
  const sourceFields = source.get(tagPattern);
  const fieldTag = sourceFields.map(field => field.tag);
  debug(`Comparing field ${fieldTag}`);

  checkFieldType(baseFields);
  checkFieldType(sourceFields);

  if (baseFields.length > 1 || sourceFields.length > 1) {
    debug(`Multiple fields in base or source`);
    debug(`No changes to base`);
    return base;
  }
  const [baseField] = baseFields;
  const [sourceField] = sourceFields;

  if (baseField.tag === sourceField.tag === false) {
    debug(`Base tag ${baseField.tag} is not equal to source tag ${sourceField.tag}`);
    debug(`No changes to base`);
    return base;
  }
  const baseSubs = baseField.subfields;
  const sourceSubs = sourceField.subfields;

  const baseSubsNormalized = baseSubs
    .map(({code, value}) => ({code, value: normalizeSubfieldValue(value)}));

  const sourceSubsNormalized = sourceSubs
    .map(({code, value}) => ({code, value: normalizeSubfieldValue(value)}));

  // Returns the base subfields for which a matching source subfield is found
  const equalSubfieldsBase = baseSubsNormalized
    .filter(baseSubfield => sourceSubsNormalized
      .some(sourceSubfield => equalityFunction(baseSubfield, sourceSubfield)));
  debug(`equalSubfieldsBase: ${JSON.stringify(equalSubfieldsBase, undefined, 2)}`);

  // Returns the source subfields for which a matching base subfield is found
  const equalSubfieldsSource = sourceSubsNormalized
    .filter(sourceSubfield => baseSubsNormalized
      .some(baseSubfield => equalityFunction(sourceSubfield, baseSubfield)));
  debug(`equalSubfieldsSource: ${JSON.stringify(equalSubfieldsSource, undefined, 2)}`);

  if (baseSubs.length === sourceSubs.length && equalSubfieldsBase.length < baseSubs.length) {
    debug(`Base and source subfields are not equal`);
    debug(`No changes to base`);
    return base;
  }

  if (baseSubs.length === sourceSubs.length && equalSubfieldsBase.length === equalSubfieldsSource.length) {
    debug(`Checking subfield equality`);
    const totalSubfieldLengthBase = baseSubsNormalized
      .map(({value}) => value.length)
      .reduce((acc, value) => acc + value);
    const totalSubfieldLengthSource = sourceSubsNormalized
      .map(({value}) => value.length)
      .reduce((acc, value) => acc + value);

    if (totalSubfieldLengthSource > totalSubfieldLengthBase) {
      return replaceBasefieldWithSourcefield(base);
    }
  }

  if (sourceSubs.length > baseSubs.length && equalSubfieldsBase.length === baseSubs.length) {
    return replaceBasefieldWithSourcefield(base);
  }

  debug(`No changes to base`);
  return base;

  function replaceBasefieldWithSourcefield(base) {
    const index = base.fields.findIndex(field => field === baseField);
    base.fields.splice(index, 1, sourceField); // eslint-disable-line functional/immutable-data
    debug(`Source field is longer, replacing base with source`);
    return base;
  }

  function checkFieldType(fields) {
    const checkedFields = fields.map(field => {
      if ('value' in field) { // eslint-disable-line functional/no-conditional-statement
        throw new Error('Invalid control field, expected data field');
      }
      return field;
    });
    return checkedFields;
  }

  function normalizeSubfieldValue(value) {
    // Regexp options: g: global search, u: unicode
    const punctuation = /[.,\-/#!?$%^&*;:{}=_`~()[\]]/gu;
    return normalizeSync(value).toLowerCase().replace(punctuation, '', 'u').replace(/\s+/gu, ' ').trim();
  }
};
