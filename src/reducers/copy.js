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
// Import createDebugLogger from 'debug';

export default (pattern) => (base, source) => {
//  Const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(pattern);
  const sourceFields = source.get(pattern);
  return copyFields();

  function copyFields() {
    // Test 01: If base does not contain the field at all, it is copied from source to base
    if (baseFields.length === 0) {
      sourceFields.forEach(f => base.insertField(f));
      return base;
    }
    const filterMissing = function(sourceField) {
      // Test 02: Identical control fields are not copied
      if ('value' in sourceField) {
        return baseFields.some(isIdenticalControlField) === false;
      }
      // Test 04: Identical data fields in base and source, not copied
      // Test 05: Different data fields are copied from source to base
      if ('subfields' in sourceField) {
        return baseFields.some(isIdenticalDataField) === false;
      }

      function normalizeControlField(field) {
        return field.value.toLowerCase().replace(/\s+/u, '');
      }

      function isIdenticalControlField(baseField) {
        const normalizedBaseField = normalizeControlField(baseField);
        const normalizedSourceField = normalizeControlField(sourceField);
        return normalizedSourceField === normalizedBaseField;
      }
      function isIdenticalDataField(baseField) {
        if (sourceField.tag === baseField.tag &&
          sourceField.ind1 === baseField.ind1 &&
          sourceField.ind2 === baseField.ind2 &&
          sourceField.subfields.length === baseField.subfields.length) {
          return baseField.subfields.every(isIdenticalSubfield);
        }
        function normalizeSubfield(subfield) {
          return subfield.value.toLowerCase().replace(/\s+/u, '');
        }
        function isIdenticalSubfield(baseSub) {
          const normBaseSub = normalizeSubfield(baseSub);
          return sourceField.subfields.some(sourceSub => {
            const normSourceSub = normalizeSubfield(sourceSub);
            return normSourceSub === normBaseSub;
          });
        }
      }
    };
    // Search for fields missing from base
    const missingFields = sourceFields.filter(filterMissing);
    // Test 03: Add missing control field to base
    // Test 05: Add missing data field to base
    missingFields.forEach(f => base.insertField(f));
    return base; // This is returned by copyFields
  }
};
