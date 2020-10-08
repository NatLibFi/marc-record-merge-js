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
import {normalizeSync} from 'normalize-diacritics';

export function strictEquality(subfieldA, subfieldB) {
  return subfieldA.code === subfieldB.code &&
  subfieldA.value === subfieldB.value;
}

export function subsetEquality(subfieldA, subfieldB) {
  return subfieldA.code === subfieldB.code &&
  (subfieldA.value.indexOf(subfieldB.value) !== -1 || subfieldB.value.indexOf(subfieldA.value) !== -1);
}

export default ({pattern, equalityFunction = strictEquality}) => (base, source) => {
  const baseFields = base.get(pattern);
  const sourceFields = source.get(pattern);

  checkFieldType(baseFields);
  checkFieldType(sourceFields);

  if (baseFields.length > 1 || sourceFields.length > 1) {
    return base;
  }
  const [baseField] = baseFields;
  const [sourceField] = sourceFields;

  if (baseField.tag === sourceField.tag === false) {
    return base;
  }
  const baseSubs = baseField.subfields;
  const sourceSubs = sourceField.subfields;

  const baseSubsNormalized = baseSubs
    .map(({code, value}) => ({code, value: normalizeSubfieldValue(value)}));

  const sourceSubsNormalized = sourceSubs
    .map(({code, value}) => ({code, value: normalizeSubfieldValue(value)}));

  const equalSubfieldsBase = baseSubsNormalized
    .filter(baseSubfield => sourceSubsNormalized
      .some(sourceSubfield => equalityFunction(baseSubfield, sourceSubfield)));

  const equalSubfieldsSource = sourceSubsNormalized
    .filter(sourceSubfield => baseSubsNormalized
      .some(baseSubfield => equalityFunction(sourceSubfield, baseSubfield)));

  if (baseSubs.length === sourceSubs.length && equalSubfieldsBase.length < baseSubs.length) {
    return base;
  }

  if (baseSubs.length === sourceSubs.length && equalSubfieldsBase.length === equalSubfieldsSource.length) {
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

  return base;

  function replaceBasefieldWithSourcefield(base) {
    const index = base.fields.findIndex(field => field === baseField);
    base.fields.splice(index, 1, sourceField); // eslint-disable-line functional/immutable-data
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
    const punctuation = /[.,\-/#!$%^&*;:{}=_`~()[\]]/gu;
    return normalizeSync(value).toLowerCase().replace(punctuation, '', 'u').replace(/\s+/gu, ' ').trim();
  }
};
