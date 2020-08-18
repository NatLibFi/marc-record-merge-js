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
//import {normalize} from 'normalize-diacritics';
import {normalizeSync} from 'normalize-diacritics';

export default (pattern) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(pattern);
  const sourceFields = source.get(pattern);
  return selectFields();

  function selectFields() {
    // Check that the field is a data field
    const x = checkFieldType(baseFields);
    debug(`checkFieldType: ${JSON.stringify(x, undefined, 2)}`);
    // Check that the base and source tags are identical
    const y = baseFields.map(checkTags);
    debug(`checkTags: ${JSON.stringify(y, undefined, 2)}`);
    // Normalize subfields of both base and source fields in order:
    // 1. Remove diacritics (test 01)
    // return array to feed into step 2
    const normBases = baseFields.map(normalizeDiacritics);
    debug(`normalizeDiacritics for baseFields: ${JSON.stringify(normBases, undefined, 2)}`);
    const normSources = sourceFields.map(normalizeDiacritics);
    debug(`normalizeDiacritics for sourceFields: ${JSON.stringify(normSources, undefined, 2)}`);
    
    // 2. Change to lowercase (test 02)
    // return array to feed into step 3
    const t = baseFields.map(changeToLowerCase);
    debug(`changeToLowerCase for baseFields: ${JSON.stringify(t, undefined, 2)}`);
    const u = sourceFields.map(changeToLowerCase);
    debug(`changeToLowerCase for sourceFields: ${JSON.stringify(u, undefined, 2)}`);

    // 3. Replace sequential whitespace with a single whitespace character (test 03)
    // Note: can there be whitespace at the start and end of a value? remove completely?
    // return array to feed into step 4

    // 4. Remove punctuation characters (test 04)
    // return array for equality comparison

    // Compare equality of normalized subfields:
    // 1. Default: Strict equality (subfield values and codes are equal)
    // 2. Subset comparison (equal codes, one subfield value may be a subset of the other)

    const mergedFields = baseFields; // parhaat kentät mergataan
    debug(`mergedFields: ${JSON.stringify(selectedFields, undefined, 2)}`);

    // Functions:

    // Check whether the field is a data field
    function checkFieldType() {
      const checkedFields = baseFields.map(field => {
        // Control fields are not handled here
        if ('value' in field) {
          const err = new Error('Invalid control field, expected data field');
          throw err;
        }
        // Data fields are passed on
        return true;
      });
      return checkedFields;
    }

    // Base and source field tags must be equal
    function checkTags(baseField) {
      const tags = [];
      sourceFields.map(sourceField => {
        debug(`sourceField.tag: ${sourceField.tag}`);
        debug(`baseField.tag: ${sourceField.tag}`);
        if (sourceField.tag === baseField.tag) {
          return tags.push('1');
        };
        return tags.push('0');
      });
      debug(`tags: ${tags}`);
      return tags;
    }

    function normalizeDiacritics(field) {
      const values = field.subfields.map(subfield => subfield.value);
      const a = values.map(value => normalizeSync(value));
      debug(`normalizeDiacritics: ${JSON.stringify(a, undefined, 2)}`);
      return a;
    }

    function changeToLowerCase(field) {
        const values = field.subfields.map(subfield => subfield.value);
        const b = values.map(value => value.toLowerCase());
        debug(`changeToLowerCase: ${JSON.stringify(b, undefined, 2)}`);
        return b;
    }

  return mergedFields;
  }
};

