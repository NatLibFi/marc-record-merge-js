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
 * Test 01: If base does not contain the field at all, it is copied from source to base
 * Test 02: Identical control fields are not copied
 * Test 03: Add missing control field to base
 * Test 04: Identical data fields in base and source, not copied
 * Test 05: Different data fields are copied from source to base
 * Test 06: compareTagsOnly: Compare tags to see if field is non-repeatable and don't copy, even if it is different
 * Test 07: excludeSubfields: Same as 05, but do not compare subfields listed in excludeSubfields.json
 * */

import createDebugLogger from 'debug';

export default ({tagPattern, compareTagsOnly = false, excludeSubfields}) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(tagPattern);
  // Debug(`baseFields: ${JSON.stringify(baseFields, undefined, 2)}`);
  const sourceFields = source.get(tagPattern);
  // Debug(`sourceFields: ${JSON.stringify(sourceFields, undefined, 2)}`);
  return copyFields();

  function copyFields() {
    debug(`compareTagsOnly: ${compareTagsOnly}`);
    // If compareTagsOnly = true, only this part is run to see if the field is missing completely from Melinda (base)
    if (baseFields.length === 0) {
      sourceFields.forEach(f => base.insertField(f));
      return base;
    }

    // If compareTagsOnly = false (default), source and base subfields are compared
    if (!compareTagsOnly) {
      const filterMissing = function(sourceField) {
        if ('value' in sourceField) {
          return baseFields.some(isIdenticalControlField) === false;
        }
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
            const sourceSubsToCompare = sourceField.subfields;
            debug(`sourceSubsToCompare: ${JSON.stringify(sourceSubsToCompare, undefined, 2)}`);
            // If excluded subfields have been defined for this field
            if (excludeSubfields) {
              debug(`in excludeSubfields block`);
              const excludedSubfields = excludeSubfields;
              debug(`excludedSubfields: ${JSON.stringify(excludedSubfields, undefined, 2)} isArray: ${Array.isArray(excludedSubfields)}`);
              // Return the subfields that are not in excludedSubfields
              function filterExcluded(subfield) {
                return excludedSubfields.indexOf(subfield.code) === -1;
              }
              debug(`filter results: ${JSON.stringify(sourceSubsToCompare.filter(filterExcluded), undefined, 2)} `);
              return sourceSubsToCompare.filter(filterExcluded);
            }
            debug(`testing`);
            const result = sourceSubsToCompare.some(sourceSub => {
              const normSourceSub = normalizeSubfield(sourceSub);
              return normSourceSub === normBaseSub;
            });
            debug(`result: ${JSON.stringify(result, undefined, 2)}`);
            return result;

            /* Return sourceSubsToCompare.some(sourceSub => {
                const normSourceSub = normalizeSubfield(sourceSub);
                return normSourceSub === normBaseSub;
              })*/
          }
        }
      };
      // Search for fields missing from base
      const missingFields = sourceFields.filter(filterMissing);
      missingFields.forEach(f => base.insertField(f));
    }
    debug(`base to return: ${JSON.stringify(base, undefined, 2)}`);
    return base;
  }
};
