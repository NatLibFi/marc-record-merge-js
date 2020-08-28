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
  const baseFieldsFromPattern = base.get(pattern);
  const sourceFieldsFromPattern = source.get(pattern);
  return selectFields();

  function selectFields() {
    // Check that all fields are data fields
    // Test 01: The field is a control field (contains 'value')
    const baseFields = checkFieldType(baseFieldsFromPattern);
    debug(`baseFields: ${JSON.stringify(baseFields, undefined, 2)}`);
    const sourceFields = checkFieldType(sourceFieldsFromPattern);
    debug(`sourceFields: ${JSON.stringify(sourceFields, undefined, 2)}`);
      
    // Test 02: If there are multiple fields, the base field is returned unmodified
    if (baseFields.length > 1 || sourceFields.length > 1) {
      debug(`Multiple fields in base or source`);
      return base;
    }

    // Check that the base and source tags are equal
    // Test 03: Base and source tags are equal for one field
    // Test 04: Base and source tags are not equal 
    // Note: to check this, the pattern has to allow two tags, otherwise the unequal tag does not even pass source.get(pattern)
   
    if (checkTags(baseFields, sourceFields) === false) {
      debug(`Tags are not equal`);
      return base;
    }
    
    // Test 05: Normalize subfields of both base and source fields in order:
    // 1. Remove diacritics
    // 2. Change to lowercase
    // 3. Trim whitespace at ends and replace sequential whitespace with a single whitespace character
    // 4. Remove punctuation characters

    // Is it better to do all normalization in one function like this?
    baseFields.forEach(field => field.subfields.forEach(normalizeSubfieldValue));
    // Or each phase separately in its own function? 
    // In the beginning this was easier for debugging, but now all phases could be put in the same function,
    // unless there is a need to perform only some of these actions (but not all) on some kind of data.
/*    baseFields.forEach(field => field.subfields.forEach(normalizeDiacritics));
    baseFields.forEach(field => field.subfields.forEach(changeToLowerCase));
    baseFields.forEach(field => field.subfields.forEach(removeWhitespace));
    baseFields.forEach(field => field.subfields.forEach(removePunctuation)); */
    debug(`baseFields normalized: ${JSON.stringify(baseFields, undefined, 2)}`);

    sourceFields.forEach(field => field.subfields.forEach(normalizeSubfieldValue));
    /*sourceFields.forEach(field => field.subfields.forEach(normalizeDiacritics));
    sourceFields.forEach(field => field.subfields.forEach(changeToLowerCase));
    sourceFields.forEach(field => field.subfields.forEach(removeWhitespace));
    sourceFields.forEach(field => field.subfields.forEach(removePunctuation));*/
    debug(`sourceFields normalized: ${JSON.stringify(sourceFields, undefined, 2)}`);

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
        if ('value' in field) {
          throw new Error('Invalid control field, expected data field');
        }
        // Data fields are passed on
        return field;
      });
      return checkedFields;
    }

    // Base and source field tags must be equal
    function checkTags(baseFields, sourceFields) {
      // At this point we know that both base and source have only one field, 
      // since they were checked for multiple fields earlier
      const baseTag = JSON.stringify(baseFields.map(field => field.tag));
      debug(`baseTag: ${baseTag} is ${typeof baseTag}`);
      const sourceTag = JSON.stringify(sourceFields.map(field => field.tag));
      debug(`sourceTag: ${sourceTag} is ${typeof sourceTag}`);
      if (baseTag !== sourceTag) {
        return false;
      }
      return true;
    }
    
    // This would be the shortest version, but phases 3 and 4 are in a different order than in the specs
    // i.e. punctuation is removed first and whitespaces after that (to get rid of potential whitespace within punctuation)
    function normalizeSubfieldValue(subfield) {
      const regexp = /[.,\-/#!$%\^&*;:{}=_`~()[\]]/g;
      subfield.value = normalizeSync(subfield.value);
      subfield.value = subfield.value.toLowerCase().replace(regexp, '').replace(/\s+/g, ' ').trim();
      // Or keep the order in the specs and have each phase on its own row?
      // This might be easier to read? (but whitespace removal is done twice)
/*    subfield.value = subfield.value.toLowerCase();
      subfield.value = subfield.value.replace(/\s+/g, ' ').trim();
      subfield.value = subfield.value.replace(regexp, '').replace(/\s+/g, ' ').trim();*/
      return subfield;
    }

    /*function normalizeDiacritics(subfield) {
      // "  #?    Héllö    &* wôRld %   " --> "  #?    Hello    &* woRld %   "
      subfield.value = normalizeSync(subfield.value);
      return subfield;
    }

    function changeToLowerCase(subfield) {
      // "  #?    Hello    &* woRld %   " --> "  #?    hello    &* world %   "
      subfield.value = subfield.value.toLowerCase();
      return subfield;
    }

    function removeWhitespace(subfield) {
      // "  #?    hello    &* world %   " --> "#? hello &* world %"
      subfield.value = subfield.value.replace(/\s+/g, ' ').trim();
      return subfield;    
     }

    function removePunctuation(subfield) {
      // "#? hello &* world %" --> "hello world"
      const regexp = /[.,\-/#!$%\^&*;:{}=_`~()[\]]/g;
      // Whitespace removed again at the end to get rid of possible new whitespace caused by removing punctuation marks
      // Without this, "#? hello &* world %" would be returned here as " hello  world "
      subfield.value = subfield.value.replace(regexp, '').replace(/\s+/g, ' ').trim();
      return subfield;
    }*/

  function compareEquality(baseFields, sourceFields) {
    // something
  }
  // equality comparison function
  // calculate the difference of subfields
  // check if they are a subset of each other

  //const mergedFields = sourceFields.filter(compareEquality);
  // return mergedFields;
  return base; // This is returned by selectFields
  }
};

