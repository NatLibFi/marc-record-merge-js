/* eslint-disable max-statements */
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
  sourceValidators = {subfieldValues: false},
  swapTag = [],
  swapSubfieldCode = [],
  doNotCopyIfFieldPresent = false
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
  const doNotCopy = doNotCopyIfFieldPresent ? baseRecord.get(doNotCopyIfFieldPresent).length > 0 : false;

  if (doNotCopy) {
    return baseRecord.toObject();
  }

  debug(`Base fields: `, baseFields);
  debug(`Source fields: `, sourceFields);

  const baseCompareFields = baseFields.map(baseField => createCompareField(baseField));
  const compareResultFields = compareFields(sourceFields, baseCompareFields);
  const droppedUnwantedSubfield = checkDropSubfields(compareResultFields);
  const droppedUnwantedFields = checkCopyUnlessFields(droppedUnwantedSubfield);
  const swappedSubfields = checkSwapSubfieldCodes(droppedUnwantedFields);
  const swappedTags = checkSwapTag(swappedSubfields);
  debug('Fields to be copied');
  debug(JSON.stringify(swappedTags));

  // Add fields to base;
  swappedTags.forEach(field => baseRecord.insertField(field));
  return baseRecord.toObject();
  //return copyFields(baseFields, sourceFields);

  function compareFields(sourceFields, baseCompareFields, uniqFields = []) {
    const [sourceField, ...rest] = sourceFields;
    if (sourceField === undefined) {
      return uniqFields;
    }

    if (baseCompareFields.length === 0) {
      return compareFields(rest, baseCompareFields, [...uniqFields, sourceField]);
    }

    // Source and base are also compared for identicalness
    // Non-identical fields are copied from source to base as duplicates
    const sourceCompareField = createCompareField(sourceField);
    const unique = checkCompareFields(baseCompareFields, sourceCompareField);

    debugCompare(`${JSON.stringify(sourceField)} ${unique ? 'is UNIQUE' : 'not UNIQUE'}`);

    if (unique) {
      return compareFields(rest, baseCompareFields, [...uniqFields, sourceField]);
    }

    return compareFields(rest, baseCompareFields, uniqFields);

    function checkCompareFields(baseCompareFields, sourceCompareField) {
      let unique = true; // eslint-disable-line functional/no-let

      baseCompareFields.forEach(baseCompareField => {
        debugCompare(`Comparing ${JSON.stringify(sourceCompareField)} to ${JSON.stringify(baseCompareField)}}`);

        if (sourceCompareField.value !== baseCompareField.value) {
          debugCompare(`Value is different ${sourceCompareField.value} !== ${baseCompareField.value}`);
          return;
        }

        if (sourceCompareField.ind1 !== baseCompareField.ind1) {
          debugCompare(`Ind1 is different ${sourceCompareField.ind1} !== ${baseCompareField.ind1}`);
          return;
        }

        if (sourceCompareField.ind2 !== baseCompareField.ind2) {
          debugCompare(`Ind2 is different ${sourceCompareField.ind2} !== ${baseCompareField.ind2}`);
          return;
        }

        if ('subfields' in sourceCompareField) {
          const allFound = checkSubfields(sourceCompareField.subfields, baseCompareField.subfields);
          debugCompare(`Subfields are different ${!allFound}`);
          if (!allFound) {
            return;
          }

          unique = false;
          return;
        }

        unique = false;
        return;
      });

      return unique;
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

  function checkSwapTag(fields) {
    if (swapTag.length > 0) {
      return fields.map(field => ({...field, tag: swapTagsFunc(field.tag)}));
    }

    return fields;

    function swapTagsFunc(tag) {
      const [foundRule] = swapTag.filter(rule => new RegExp(rule.from, 'u').test(tag));

      if (foundRule === undefined) {
        return tag;
      }

      return foundRule.to;
    }
  }

  function checkSwapSubfieldCodes(fields) {
    if (swapSubfieldCode.length > 0) {
      return fields.map(field => ({...field, subfields: swapSubfieldCodesFunc(field.subfields)}));
    }

    return fields;

    function swapSubfieldCodesFunc(subfields) {
      return subfields.map(sub => {
        const [foundRule] = swapSubfieldCode.filter(rule => rule.from === sub.code);

        if (foundRule === undefined) {
          return sub;
        }

        return {code: foundRule.to, value: sub.value};
      });
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
