import {normalizeSync} from 'normalize-diacritics';
import createDebugLogger from 'debug';
import {MarcRecord} from '@natlibfi/marc-record';

export function strictEquality(subfieldA, subfieldB) {
  return subfieldA.code === subfieldB.code &&
    subfieldA.value === subfieldB.value;
}

export function subsetEquality(subfieldA, subfieldB) {
  return subfieldA.code === subfieldB.code &&
    (subfieldA.value.indexOf(subfieldB.value) !== -1 || subfieldB.value.indexOf(subfieldA.value) !== -1);
}
// EqualityFunction can be either strictEquality or subsetEquality
export default ({tagPattern, equalityFunction = strictEquality}) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge:select');
  const baseRecord = new MarcRecord(base, {subfieldValues: false});
  const sourceRecord = new MarcRecord(source, {subfieldValues: false});
  const baseFields = baseRecord.get(tagPattern);
  const sourceFields = sourceRecord.get(tagPattern);
  const fieldTag = sourceFields.map(field => field.tag);
  debug(`Comparing field ${fieldTag}`);

  checkFieldType(baseFields);
  checkFieldType(sourceFields);

  if (baseFields.length > 1 || sourceFields.length > 1) {
    debug(`Multiple fields in base or source`);
    debug(`No changes to base`);
    return base;
  }
  const [baseField] = baseFields;
  const [sourceField] = sourceFields;

  if (baseField.tag === sourceField.tag === false) {
    debug(`Base tag ${baseField.tag} is not equal to source tag ${sourceField.tag}`);
    debug(`No changes to base`);
    return base;
  }
  const baseSubs = baseField.subfields;
  const sourceSubs = sourceField.subfields;

  const baseSubsNormalized = baseSubs
    .map(({code, value}) => ({code, value: normalizeSubfieldValue(value)}));

  const sourceSubsNormalized = sourceSubs
    .map(({code, value}) => ({code, value: normalizeSubfieldValue(value)}));

  // Returns the base subfields for which a matching source subfield is found
  const equalSubfieldsBase = baseSubsNormalized
    .filter(baseSubfield => sourceSubsNormalized
      .some(sourceSubfield => equalityFunction(baseSubfield, sourceSubfield)));
  debug(`equalSubfieldsBase: ${JSON.stringify(equalSubfieldsBase, undefined, 2)}`);

  // Returns the source subfields for which a matching base subfield is found
  const equalSubfieldsSource = sourceSubsNormalized
    .filter(sourceSubfield => baseSubsNormalized
      .some(baseSubfield => equalityFunction(sourceSubfield, baseSubfield)));
  debug(`equalSubfieldsSource: ${JSON.stringify(equalSubfieldsSource, undefined, 2)}`);

  if (baseSubs.length === sourceSubs.length && equalSubfieldsBase.length < baseSubs.length) {
    debug(`Base and source subfields are not equal`);
    debug(`No changes to base`);
    return base;
  }

  if (baseSubs.length === sourceSubs.length && equalSubfieldsBase.length === equalSubfieldsSource.length) {
    debug(`Checking subfield equality`);
    const totalSubfieldLengthBase = baseSubsNormalized
      .map(({value}) => value.length)
      .reduce((acc, value) => acc + value);
    const totalSubfieldLengthSource = sourceSubsNormalized
      .map(({value}) => value.length)
      .reduce((acc, value) => acc + value);

    if (totalSubfieldLengthSource > totalSubfieldLengthBase) {
      return replaceBasefieldWithSourcefield(base);
    }
  }

  if (sourceSubs.length > baseSubs.length && equalSubfieldsBase.length === baseSubs.length) {
    return replaceBasefieldWithSourcefield(base);
  }

  debug(`No changes to base`);
  return base;

  function replaceBasefieldWithSourcefield(base) {
    const index = base.fields.findIndex(field => field === baseField);
    base.fields.splice(index, 1, sourceField); // eslint-disable-line functional/immutable-data
    debug(`Source field is longer, replacing base with source`);
    return base;
  }

  function checkFieldType(fields) {
    const checkedFields = fields.map(field => {
      if ('value' in field) { // eslint-disable-line functional/no-conditional-statement
        throw new Error('Invalid control field, expected data field');
      }
      return field;
    });
    return checkedFields;
  }

  function normalizeSubfieldValue(value) {
    // Regexp options: g: global search, u: unicode
    const punctuation = /[.,\-/#!?$%^&*;:{}=_`~()[\]]/gu;
    return normalizeSync(value).toLowerCase().replace(punctuation, '', 'u').replace(/\s+/gu, ' ').trim();
  }
};
