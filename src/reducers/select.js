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
    //const y = baseFields.map(checkTags);
    //const y = checkTags(baseFields, sourceFields);
    //debug(`checkTags: ${JSON.stringify(y, undefined, 2)}`);

    // Normalize subfields of both base and source fields in order:
    // 1. Remove diacritics (test 01)
    // 2. Change to lowercase (test 02)
    // 3. Trim whitespace at ends and replace sequential whitespace with a single whitespace character (test 03)
    // 4. Remove punctuation characters (test 04)
    // ###Should whitespace be trimmed (again) after removing punctuation? 
    // In one of my test cases, there is a string of punctuation characters with one space between it and the actual word, 
    // and this one space remains at the end when punctuation is removed:
    // " =_`~ ([çšŕňŭųœ])  " becomes " csrnuuoe" and not "csrnuuoe" as it should be

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

    const mergedFields = baseFields; // parhaat kentät mergataan
    debug(`mergedFields: ${JSON.stringify(selectedFields, undefined, 2)}`);

    // Functions:

    // Check that all fields are data fields
    function checkFieldType(fields) {
      const checkedFields = fields.map(field => {
        // Control fields are not handled here
        // ###Should this do something else in addition to throwing an error?
        if ('value' in field) {
          throw new Error('Invalid control field, expected data field');
        }
        // Data fields are passed on
        return field;
      });
      return checkedFields;
    }

    // Base and source field tags must be equal
    // ###Function with two objects as parameters, compare values for the "tag" key, return what?
    // ###What should be done if the tags are not equal?
    /*function checkTags(baseFields, sourceFields) {
      const tags = [];
      baseFields.map(baseField => {
        //debug(`sourceField.tag: ${sourceField.tag}`);
        //debug(`baseField.tag: ${sourceField.tag}`);
        if (baseField.tag === sourceField.tag) {
          return tags.push('1');
        };
        return tags.push('0');
      });
      debug(`tags: ${tags}`);
      const isOne = value => value == '1';
      if (tags.every(isOne)) {
        return true;
      };
      return false;
    }*/
    
    function normalizeDiacritics(field) {
      const values = field.subfields.map(subfield => subfield.value);
      const a = values.map(value => normalizeSync(value));
      debug(`normalizeDiacritics: ${JSON.stringify(a, undefined, 2)}`);
      return a;
    }

    function changeToLowerCase(array) {
      const b = array.map(value => value.toLowerCase());
      debug(`changeToLowerCase: ${JSON.stringify(b, undefined, 2)}`);
      return b;
  }

    function removeWhitespace(array) {
      const c = array.map(value => value.replace(/\s\s+/g, ' ').trim());    
      debug(`removeWhitespace: ${JSON.stringify(c, undefined, 2)}`);
      return c;
    }

    function removePunctuation(array) {
      const regexp = /[\.\,\-,\/\#\!\$\%\^\&\*\;\:\{\}\=\_\`\~\(\)\[\]]/g;
      const d = array.map(value => value.replace(regexp, ''));    
      debug(`removePunctuation: ${JSON.stringify(d, undefined, 2)}`);
      return d;
    }

  return mergedFields;
  }
};

