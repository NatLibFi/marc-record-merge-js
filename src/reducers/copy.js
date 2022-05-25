/* eslint-disable no-unused-vars */

import {MarcRecord} from '@natlibfi/marc-record';
import createDebugLogger from 'debug';

export default ({
  tagPattern,
  compareTagsOnly = false,
  compareWithoutIndicators = false,
  subfieldsMustBeIdentical = true,
  excludeSubfields = [],
  dropSubfields = [],
  copyUnless = [],
  baseValidators = {subfieldValues: false},
  sourceValidators = {subfieldValues: false}
}) => (base, source) => {
  const baseRecord = new MarcRecord(base, baseValidators);
  const sourceRecord = new MarcRecord(source, sourceValidators);

  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const debugOptions = createDebugLogger('@natlibfi/marc-record-merge:compare-options');
  const debugCompare = createDebugLogger('@natlibfi/marc-record-merge:compare');
  debugOptions(`Tag Pattern: ${tagPattern}`);
  debugOptions(`Compare tags only: ${compareTagsOnly}`);
  debugOptions(`Compare without indicators ${compareWithoutIndicators}`);
  debugOptions(`Copy if identical: ${subfieldsMustBeIdentical}`);
  debugOptions(`Exclude subfields: [${excludeSubfields}]`);
  debugOptions(`Drop subfields [${dropSubfields}]`);
  debugOptions(`Copy unless contains subfields: ${JSON.stringify(copyUnless)}`);

  const baseFields = baseRecord.get(tagPattern);
  const sourceFields = sourceRecord.get(tagPattern);

  debug(`Base fields: `, baseFields);
  debug(`Source fields: `, sourceFields);

  const compareResultFields = compareFields(sourceFields, baseFields);
  const droppedUnwantedSubfield = checkDropSubfields(compareResultFields);
  const droppedUnwantedFields = checkCopyUnlessFields(droppedUnwantedSubfield);
  debug('Fields to be copied');
  debug(JSON.stringify(droppedUnwantedFields));

  // Add fields to base;
  droppedUnwantedFields.forEach(field => baseRecord.insertField(field));
  return baseRecord.toObject();
  //return copyFields(baseFields, sourceFields);

  function compareFields(sourceFields, baseFields, uniqFields = []) {
    const [sourceField, ...rest] = sourceFields;
    if (sourceField === undefined) {
      return uniqFields;
    }

    if (baseFields.length === 0) {
      return compareFields(rest, baseFields, [...uniqFields, sourceField]);
    }

    // Source and base are also compared for identicalness
    // Non-identical fields are copied from source to base as duplicates
    const sourceComapareField = createCompareField(sourceField);
    const baseCompareFields = baseFields.map(baseField => createCompareField(baseField));

    const unique = checkCompareFields(baseCompareFields, sourceComapareField);

    debugCompare(`${JSON.stringify(sourceField)} ${unique ? 'is UNIQUE' : 'not UNIQUE'}`);

    if (unique) {
      return compareFields(rest, baseFields, [...uniqFields, sourceField]);
    }

    return compareFields(rest, baseFields, uniqFields);

    function checkCompareFields(baseCompareFields, sourceComapareField) {
      const [baseCompareField, ...rest] = baseCompareFields;
      if (baseCompareField === undefined) {
        return true;
      }

      if (sourceComapareField.value !== baseCompareField.value) {
        debugCompare(`Value is different ${sourceComapareField.value} !== ${baseCompareField.value}`);
        return true;
      }

      if (sourceComapareField.ind1 !== baseCompareField.ind1) {
        debugCompare(`Ind1 is different ${sourceComapareField.ind1} !== ${baseCompareField.ind1}`);
        return true;
      }

      if (sourceComapareField.ind2 !== baseCompareField.ind2) {
        debugCompare(`Ind2 is different ${sourceComapareField.ind2} !== ${baseCompareField.ind2}`);
        return true;
      }

      if ('subfields' in sourceComapareField) {
        const allFound = checkSubfields(sourceComapareField.subfields, baseCompareField.subfields);
        debugCompare(`Subfields are different ${!allFound}`);
        return allFound ? false : checkCompareFields(rest, sourceComapareField);
      }

      return false;
    }

    function checkSubfields(sourceSubfields, baseSubfields) {
      const foundSubs = sourceSubfields.filter(sSub => baseSubfields.some(bSub => sSub.code === bSub.code && sSub.value === bSub.value));

      if (subfieldsMustBeIdentical) {
        return foundSubs.length === sourceSubfields.length && foundSubs.length === baseSubfields.length;
      }

      return foundSubs.length === sourceSubfields.length;
    }
  }

  function createCompareField(field) {
    if (compareTagsOnly) {
      return {tag: field.tag};
    }

    if ('value' in field) {
      return {tag: field.tag, value: field.value};
    }

    const [filteredField] = checkDropSubfields([field]);

    const params = [
      {name: 'tag', value: field.tag},
      {name: 'ind1', value: compareWithoutIndicators ? undefined : field.ind1},
      {name: 'ind2', value: compareWithoutIndicators ? undefined : field.ind2},
      {name: 'subfields', value: createCompareSubfields(filteredField.subfields)}
    ].map(param => [param.name, param.value]);

    return Object.fromEntries(params);

    function createCompareSubfields(subfields) {
      const nonExcludedSubfields = subfields.filter(sub => !excludeSubfields.some(code => code === sub.code));
      const normalizedSubfields = nonExcludedSubfields.map(sub => ({code: sub.code, value: normalizeSubfieldValue(sub.value)}));

      return normalizedSubfields;

      function normalizeSubfieldValue(value) {
        return value.toLowerCase().replace(/\s+/ug, '');
      }
    }
  }

  function checkDropSubfields(fields) {
    if (dropSubfields.length > 0) {
      return fields.map(field => ({...field, subfields: dropSubfieldsFunc(field.subfields)}))
        .filter(field => field.subfields.length > 0);
    }

    return fields;

    function dropSubfieldsFunc(subfields) {
      return subfields.filter(sub => { // eslint-disable-line
        return !dropSubfields.some(({code, value = false, condition = false}) => {
          if (code !== sub.code) {
            return false;
          }

          if (!condition && value) {
            return value === sub.value;
          }

          if (condition === 'unless' && value) {
            return !new RegExp(value, 'u').test(sub.value);
          }

          return true;
        });
      });
    }
  }

  function checkCopyUnlessFields(fields) {
    if (copyUnless.length > 0) {
      return fields.filter(({subfields}) => copyUnless.some(filter => !subfields.some(sub => sub.code === filter.code && new RegExp(filter.value, 'u').test(sub.value))));
    }

    return fields;
  }
};

// function copyFields() { //eslint-disable-line no-unused-vars
//   const sourceTags = sourceFields.map(field => field.tag);
//   sourceTags.forEach(tag => debug(`Comparing field ${tag}`));

//   /*
//   if (combine.length > 0) {
//     debug(`*** NOW Copy options: ${tagPattern}, ${compareTagsOnly}, ${compareWithoutIndicators}, ${subfieldsMustBeIdentical}, [${combine}], [${excludeSubfields}], [${dropSubfields}]`);
//     combine.forEach(row => debug(` ### combine ${row} <- `));
//     return [];
//   }
//   */

//   // If compareTagsOnly = true, only this part is run
//   // The field is copied from source only if it is missing completely from base
//   if (compareTagsOnly && baseFields.length === 0) {
//     sourceTags.forEach(tag => debug(`Missing field ${tag} copied from source to base`));
//     sourceFields.forEach(f => base.insertField(f));
//     return true;
//   }

//   // If compareTagsOnly = false (default)
//   // Source and base are also compared for identicalness
//   // Non-identical fields are copied from source to base as duplicates
//   if (!compareTagsOnly) {
//     const filterMissing = function (sourceField) {
//       if ('value' in sourceField) {
//         debug(`Checking control field ${sourceField.tag} for identicalness`);
//         return baseFields.some(isIdenticalControlField) === false;
//       }
//       if ('subfields' in sourceField) {
//         debug(`Checking data field ${sourceField.tag} for identicalness`);
//         return baseFields.some(isIdenticalDataField) === false;
//       }

//       function normalizeControlField(field) {
//         return field.value.toLowerCase().replace(/\s+/u, '');
//       }

//       function isIdenticalControlField(baseField) {
//         const normalizedBaseField = normalizeControlField(baseField);
//         const normalizedSourceField = normalizeControlField(sourceField);
//         return normalizedSourceField === normalizedBaseField;
//       }

//       function isIdenticalDataField(baseField) {
//         // If excluded subfields have been defined for this field, they must be ignored first
//         // (i.e. source and base fields are considered identical if all non-excluded subfields are identical)
//         if (excludeSubfields.length > 0 &&
//           sourceField.tag === baseField.tag &&
//           sourceField.ind1 === baseField.ind1 &&
//           sourceField.ind2 === baseField.ind2) {
//           excludeSubfields.forEach(sub => debug(`Subfield ${sub} excluded from identicalness comparison`));
//           // Compare only those subfields that are not excluded
//           const baseSubsToCompare = baseField.subfields.filter(subfield => excludeSubfields.indexOf(subfield.code) === -1);
//           return baseSubsToCompare.every(isIdenticalSubfield);
//         }
//         // If there are no excluded subfields (default case)
//         if (sourceField.tag === baseField.tag &&
//           sourceField.ind1 === baseField.ind1 &&
//           sourceField.ind2 === baseField.ind2 &&
//           sourceField.subfields.length === baseField.subfields.length) {
//           return baseField.subfields.every(isIdenticalSubfield);
//         }
//         function normalizeSubfield(subfield) {
//           return subfield.value.toLowerCase().replace(/\s+/u, '');
//         }
//         function isIdenticalSubfield(baseSub) {
//           const normBaseSub = normalizeSubfield(baseSub);
//           return sourceField.subfields.some(sourceSub => {
//             const normSourceSub = normalizeSubfield(sourceSub);
//             return normSourceSub === normBaseSub;
//           });
//         }
//       }
//     };
//     // Search for fields missing from base
//     const missingFields = sourceFields.filter(filterMissing);
//     missingFields.forEach(f => base.insertField(f));
//     if (missingFields.length > 0) {
//       const missingTags = missingFields.map(field => field.tag);
//       missingTags.forEach(tag => debug(`Field ${tag} copied from source to base`));
//       return base;
//     }
//     if (missingFields.length === 0) {
//       debug(`No missing fields found`);
//       return base;
//     }
//   }
//   debug(`No missing fields found`);
//   return base;
// }
