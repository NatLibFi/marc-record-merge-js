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
  const baseFieldsFromPattern = base.get(pattern);
  const sourceFieldsFromPattern = source.get(pattern);
  return selectFields();

  function selectFields() {
    // Check that all fields are data fields
    const baseFields = checkFieldType(baseFieldsFromPattern);
    debug(`baseFields: ${JSON.stringify(baseFields, undefined, 2)}`);
    const sourceFields = checkFieldType(sourceFieldsFromPattern);
    debug(`sourceFields: ${JSON.stringify(sourceFields, undefined, 2)}`);
    
    // Check that the base and source tags are equal
    const y = baseFields.map(checkTags);
    //const y = checkTags(baseFields, sourceFields);
    debug(`checkTags: ${JSON.stringify(y, undefined, 2)}`);

    // Normalize subfields of both base and source fields in order:
    // 1. Remove diacritics (test 01)
    // 2. Change to lowercase (test 02)
    // 3. Trim whitespace at ends and replace sequential whitespace with a single whitespace character (test 03)
    // 4. Remove punctuation characters (test 04)
    
    const baseValues = 
      baseFields.map(normalizeDiacritics)
      .map(changeToLowerCase)
      .map(removeWhitespace)
      .map(removePunctuation);
    debug(`baseValues: ${JSON.stringify(baseValues, undefined, 2)}`);
    const sourceValues = 
      sourceFields.map(normalizeDiacritics)
      .map(changeToLowerCase)
      .map(removeWhitespace)
      .map(removePunctuation);
    debug(`sourceValues: ${JSON.stringify(sourceValues, undefined, 2)}`);

    // Compare equality of normalized subfields:
    // 1. Default: Strict equality (subfield values and codes are equal)
    // 2. Subset comparison (equal codes, one subfield value may be a subset of the other)

    //const mergedFields = baseFields; // parhaat kentät mergataan
    //debug(`mergedFields: ${JSON.stringify(selectedFields, undefined, 2)}`);

    // Functions:

    // Check that all fields are data fields
    function checkFieldType(fields) {
      const checkedFields = fields.map(field => {
        // Control fields are not handled here
        if ('value' in field) {
          throw new Error('Invalid control field, expected data field');
        }
        // Data fields are passed on
        return field;
      });
      return checkedFields;
    }

    // Base and source field tags must be equal
    function checkTags(baseField) {
      const areTagsEqual = sourceFields.map(sourceField => {
        debug(`sourceField: ${JSON.stringify(sourceField, undefined, 2)}`);
        debug(`baseField.tag: ${baseField.tag}`);
        debug(`sourceField.tag: ${sourceField.tag}`);
        if (baseField.tag === sourceField.tag) {
          return true;
        }
        return false;
      });
      debug(`areTagsEqual: ${areTagsEqual}`)
      return areTagsEqual; // should return true
    }
    
    function normalizeDiacritics(field) {
      // "  #?    Héllö    &* wôRld %   " --> "  #?    Hello    &* woRld %   "
      const values = field.subfields.map(subfield => subfield.value);
      return values.map(value => normalizeSync(value));
    }

    function changeToLowerCase(values) {
      // "  #?    Hello    &* woRld %   " --> "  #?    hello    &* world %   "
      return values.map(value => value.toLowerCase());
  }

    function removeWhitespace(values) {
      // "  #?    hello    &* world %   " --> "#? hello &* world %"
      return values.map(value => value.replace(/\s+/g, ' ').trim());    
     }

    function removePunctuation(values) {
      // "#? hello &* world %" --> "hello world"
      const regexp = /[.,\-/#!$%\^&*;:{}=_`~()[\]]/g;
      // Whitespace removed again at the end to get rid of possible new whitespace caused by removing punctuation marks
      // Without this, "#? hello &* world %" would be returned here as " hello  world "
      return values.map(value => value.replace(regexp, '').replace(/\s+/g, ' ').trim());    
    }

  return mergedFields;
  }
};

