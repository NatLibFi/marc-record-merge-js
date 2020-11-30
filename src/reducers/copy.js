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
 * Test 07: excludeSubfields: Ignore excluded subfields in comparing identicalness
 * Test 08: dropSubfields: Drop subfields from source before copying
 * */
import createDebugLogger from 'debug';

export default ({tagPattern, compareTagsOnly = false, excludeSubfields = [], dropSubfields = []}) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(tagPattern);
  debug(`baseFields: ${JSON.stringify(baseFields, undefined, 2)}`);
  // Check whether there are subfields to drop from source before copying
  const sourceFields = checkDropSubfields(source.get(tagPattern));
  debug(`sourceFields: ${JSON.stringify(sourceFields, undefined, 2)}`);
  return copyFields();

  function copyFields() {
    const fieldTag = sourceFields.map(field => field.tag);
    debug(`Comparing field ${fieldTag}`);

    // If compareTagsOnly = true, only this part is run (for non-repeatable fields)
    // Is the field missing completely from base?
    if (baseFields.length === 0) {
      debug(`Missing field ${fieldTag} copied from source to base`);
      sourceFields.forEach(f => base.insertField(f));
      return base;
    }

    // If compareTagsOnly = false (default)
    // Source and base are also compared for identicalness
    // Non-identical repeatable fields are copied from source to base as duplicates
    if (!compareTagsOnly) {
      const filterMissing = function(sourceField) {
        if ('value' in sourceField) {
          debug(`Checking control field ${sourceField.tag} for identicalness`);
          return baseFields.some(isIdenticalControlField) === false;
        }
        if ('subfields' in sourceField) {
          debug(`Checking data field ${sourceField.tag} for identicalness`);
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
          // If excluded subfields have been defined for this field, they must be ignored first
          // (i.e. source and base fields are considered identical if all non-excluded subfields are identical)
          if (excludeSubfields.length > 0 &&
            sourceField.tag === baseField.tag &&
            sourceField.ind1 === baseField.ind1 &&
            sourceField.ind2 === baseField.ind2) {
            const excludedSubfields = excludeSubfields;
            debug(`Subfield(s) ${excludedSubfields} excluded from identicalness comparison`);
            // Compare only those subfields that are not excluded
            const baseSubsToCompare = baseField.subfields.filter(subfield => excludedSubfields.indexOf(subfield.code) === -1);
            debug(`baseSubsToCompare: ${JSON.stringify(baseSubsToCompare, undefined, 2)}`);
            return baseSubsToCompare.every(isIdenticalSubfield);
          }
          // If there are no excluded subfields (default case)
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
      missingFields.forEach(f => base.insertField(f));
      if (missingFields.length > 0) {
        const missingTag = missingFields.map(field => field.tag);
        debug(`Field ${missingTag} copied from source to base`);
        return base;
      }
      if (missingFields.length === 0) {
        debug(`No missing fields found`);
        return base;
      }
    }
    debug(`No missing fields found`);
    return base;
  }

  // https://stackoverflow.com/questions/38375646/filtering-array-of-objects-with-arrays-based-on-nested-value
  function checkDropSubfields(fields) {
    //debug(`fields ${JSON.stringify(fields, undefined, 2)}`);
    if (dropSubfields.length > 0) {
        debug(`Subfields ${dropSubfields} dropped from source field`);
        const fieldsAfterDrop = fields.map((field) => {
        return {...field, subfields: field.subfields.filter((subfield) => dropSubfields.indexOf(subfield.code) === -1)};
      });
      //debug(`fieldsAfterDrop: ${JSON.stringify(fieldsAfterDrop, undefined, 2)}`);
      return fieldsAfterDrop;
    }
    debug(`No subfields to drop`);
    return fields;
  }
};
