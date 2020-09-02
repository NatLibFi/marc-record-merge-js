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
    // Now that there is only one field in both baseFields and sourceFields, 
    // the arrays can be destructured into variables
    const [baseField] = baseFields;
    debug(`baseField destructured: ${JSON.stringify(baseField, undefined, 2)}`);
    const [sourceField] = sourceFields;
    debug(`sourceField destructured: ${JSON.stringify(sourceField, undefined, 2)}`);

    // Check that the base and source tags are equal
    // Test 03: Base and source tags are equal for one field (continue to comparison of contents)
    // Test 04: Base and source tags are not equal (base field returned unmodified)
    // Note: to check this, the pattern has to allow two tags, otherwise the unequal tag does not even pass source.get(pattern)
    if ((baseField.tag === sourceField.tag) === false) {
      debug(`Tags are not equal`);
      return base;
    }
    
    // Test 05: Normalize subfield values
    baseField.subfields.forEach(normalizeSubfieldValue);
    debug(`baseField normalized: ${JSON.stringify(baseField, undefined, 2)}`);
    sourceField.subfields.forEach(normalizeSubfieldValue);
    debug(`sourceField normalized: ${JSON.stringify(sourceField, undefined, 2)}`);

    // Compare equality of normalized subfields
    // Test 06: Two subfields, both equal
    // Test 07: Two subfields, same codes, values are mutual subsets
    // Test 08: Two subfields, one equal, one not (how should this work? should this use copy.js?)
    // Test 09: Two subfields, same codes, values are not subsets
    
    baseField.subfields.forEach(compareEquality);
    debug(`baseField after merge: ${JSON.stringify(baseField, undefined, 2)}`);

    // Functions:

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
 
    function normalizeSubfieldValue(subfield) {
      const regexp = /[.,\-/#!$%\^&*;:{}=_`~()[\]]/g;
      subfield.value = normalizeSync(subfield.value);
      subfield.value = subfield.value.toLowerCase();
      subfield.value = subfield.value.replace(/\s+/g, ' ').trim();
      subfield.value = subfield.value.replace(regexp, '').replace(/\s+/g, ' ').trim();
      return subfield;
    }

    function compareEquality(baseSubfield) {
      sourceField.subfields.forEach(compareSubfields);
      
      function compareSubfields(sourceSubfield) {
        debug(`baseSubfield.code is ${JSON.stringify(baseSubfield.code, undefined, 2)}`);
        debug(`baseSubfield.value is ${JSON.stringify(baseSubfield.value, undefined, 2)}`);
        debug(`sourceSubfield.code is ${JSON.stringify(sourceSubfield.code, undefined, 2)}`);
        debug(`sourceSubfield.value is ${JSON.stringify(sourceSubfield.value, undefined, 2)}`);
        // If both subfield codes and values are equal
        if (sourceSubfield.code === baseSubfield.code && sourceSubfield.value === baseSubfield.value) {
          debug(`subfields are equal`);
          // Since the values are equal, either could be assigned as the new value.
          // This assignment is not even necessary since baseSubfield keeps its old value 
          // but it may be more clear to read like this than having just an empty if block
          baseSubfield.value = baseSubfield.value;
          return;
        }
        // If subfield codes are equal but values are not, compare the values
        if (sourceSubfield.code === baseSubfield.code) {
          // Check whether one value is a subset of the other and use the longer=better value
          if (sourceSubfield.value.indexOf(baseSubfield.value) !== -1) {
            debug(`baseSubfield.value is a subset of sourceSubfield.value`);
            baseSubfield.value = sourceSubfield.value;
            return;
          }
          if (baseSubfield.value.indexOf(sourceSubfield.value) !== -1) {
            debug(`sourceSubfield.value is a subset of baseSubfield.value`);
            // Same as above, keep this for clarity
            baseSubfield.value = baseSubfield.value;
            return;
          }
          // If neither value is a subset of the other, use the longer string
          if (baseSubfield.value.length > sourceSubfield.value.length) {
            debug(`baseSubfield.value is longer`);
            baseSubfield.value = baseSubfield.value;
            return;
          }
          if (sourceSubfield.value.length > baseSubfield.value.length) {
            debug(`sourceSubfield.value is longer`);
            baseSubfield.value = sourceSubfield.value;
            return;
          }
          // If the values happen to be exactly the same length (although not equal), 
          // use baseSubfield.value
          debug(`values are equally long`);
          baseSubfield.value = baseSubfield.value;
          return;  
        }
        // If subfield codes are not equal, values are not even compared 
        // because different codes have different meanings in MARC
        debug(`subfields are not equal, nothing is returned`);
        return;
      }
    } 
  return base; // This is returned by selectFields
  }
};

