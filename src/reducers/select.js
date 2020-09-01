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
    //debug(`baseFields: ${JSON.stringify(baseFields, undefined, 2)}`);
    const sourceFields = checkFieldType(sourceFieldsFromPattern);
    //debug(`sourceFields: ${JSON.stringify(sourceFields, undefined, 2)}`);
      
    // Test 02: If there are multiple fields, the base field is returned unmodified
    if (baseFields.length > 1 || sourceFields.length > 1) {
      debug(`Multiple fields in base or source`);
      return base;
    }

    // Check that the base and source tags are equal
    // Test 03: Base and source tags are equal for one field (continue to comparison of contents)
    // Test 04: Base and source tags are not equal (base field returned unmodified)
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
    baseFields.forEach(field => field.subfields.forEach(normalizeDiacritics));
    baseFields.forEach(field => field.subfields.forEach(changeToLowerCase));
    baseFields.forEach(field => field.subfields.forEach(removeWhitespace));
    baseFields.forEach(field => field.subfields.forEach(removePunctuation));
    //debug(`baseFields normalized: ${JSON.stringify(baseFields, undefined, 2)}`);
    sourceFields.forEach(field => field.subfields.forEach(normalizeDiacritics));
    sourceFields.forEach(field => field.subfields.forEach(changeToLowerCase));
    sourceFields.forEach(field => field.subfields.forEach(removeWhitespace));
    sourceFields.forEach(field => field.subfields.forEach(removePunctuation));
    //debug(`sourceFields normalized: ${JSON.stringify(sourceFields, undefined, 2)}`);

    // Compare equality of normalized subfields:
    // 1. Default: Strict equality (subfield codes and values are equal)
    // 2. Subset comparison (equal codes, one subfield value may be a subset of the other)
    // Test 06: Two subfields, both equal
    // Test 07: Two subfields, same codes, values are mutual subsets
    // Test 08: Two subfields, one equal, one not
    // Test 09: Two subfields, same codes, values are not subsets
    
    // The best subfield values should be merged into base and returned, but how?
    const mergedFields = baseFields.map(field => field.subfields.map(compareEquality));
    debug(`mergedFields: ${JSON.stringify(mergedFields, undefined, 2)}`);

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
      //debug(`baseTag: ${baseTag} is ${typeof baseTag}`);
      const sourceTag = JSON.stringify(sourceFields.map(field => field.tag));
      //debug(`sourceTag: ${sourceTag} is ${typeof sourceTag}`);
      if (baseTag !== sourceTag) {
        return false;
      }
      return true;
    }
    // Another option: all normalization in one function
/*    function normalizeSubfieldValue(subfield) {
      const regexp = /[.,\-/#!$%\^&*;:{}=_`~()[\]]/g;
      subfield.value = normalizeSync(subfield.value);
      subfield.value = subfield.value.toLowerCase();
      subfield.value = subfield.value.replace(/\s+/g, ' ').trim();
      subfield.value = subfield.value.replace(regexp, '').replace(/\s+/g, ' ').trim();
      return subfield;
    }
*/
    function normalizeDiacritics(subfield) {
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
    }

    // Compare subfield equality
    function compareEquality(baseSubfield) {
      const comparedFields = sourceFields.filter(field => field.subfields.filter(compareSubfields));
      debug(`comparedFields: ${JSON.stringify(comparedFields, undefined, 2)}`);

      function compareSubfields(sourceSubfield) {
        debug(`baseSubfield.code is ${JSON.stringify(baseSubfield.code, undefined, 2)}`);
        debug(`baseSubfield.value is ${JSON.stringify(baseSubfield.value, undefined, 2)}`);
        debug(`sourceSubfield.code is ${JSON.stringify(sourceSubfield.code, undefined, 2)}`);
        debug(`sourceSubfield.value is ${JSON.stringify(sourceSubfield.value, undefined, 2)}`);
        // If both subfield codes and values are equal
        if (sourceSubfield.code === baseSubfield.code && sourceSubfield.value === baseSubfield.value) {
          debug(`subfields are equal`);
          // Since the values are equal, either could be returned
          return baseSubfield.value;
        }
        // If subfield codes are equal but values are not, compare the values
        if (sourceSubfield.code === baseSubfield.code) {
          // Check whether one value is a subset of the other and return the longer=better value
          if (sourceSubfield.value.indexOf(baseSubfield.value) !== -1) {
            debug(`baseSubfield.value is a subset of sourceSubfield.value`);
            return sourceSubfield.value;
          }
          if (baseSubfield.value.indexOf(sourceSubfield.value) !== -1) {
            debug(`sourceSubfield.value is a subset of baseSubfield.value`);
            return baseSubfield.value;
          }
          // If neither value is a subset of the other, return the longer string
          if (baseSubfield.value.length > sourceSubfield.value.length) {
            debug(`baseSubfield.value is longer`);
            return baseSubfield.value;
          }
          if (sourceSubfield.value.length > baseSubfield.value.length) {
            debug(`sourceSubfield.value is longer`);
            return sourceSubfield.value;
          }  
        }
        // If subfield codes are not equal, values are not even compared 
        // because different codes have different meanings in MARC
        debug(`subfields are not equal, nothing is returned`);
        return;
      }
      return comparedFields;
    }
  // The returned base should contain the best values found in equality comparison (?)
  return base; // This is returned by selectFields
  }
};

