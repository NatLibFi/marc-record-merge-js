import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import createReducer from './copy';
import generateTests from '@natlibfi/fixugen';

// import createDebugLogger from 'debug'; // <---
// const debug = createDebugLogger('@natlibfi/marc-record-merge/copy.spec.js'); // <---

generateTests({
  callback,
  path: [__dirname, '..', '..', 'test-fixtures', 'reducers', 'copy'],
  useMetadataFile: true,
  recurse: true,
  fixura: {
    reader: READERS.JSON,
    failWhenNotFound: false
  }
});

function callback({
  getFixture,
  tagPatternRegExp,
  compareTagsOnly = false,
  compareWithoutIndicators = false,
  subfieldsMustBeIdentical = false,
  copyUnless = undefined,
  excludeSubfields = undefined,
  dropSubfields = undefined,
  disabled = false
}) {
  if (disabled) {
    console.log('TEST DISABLED!'); // eslint-disable-line no-console
    return;
  }

  const base = new MarcRecord(getFixture('base.json'), {subfieldValues: false});
  const source = new MarcRecord(getFixture('source.json'), {subfieldValues: false});
  const tagPattern = new RegExp(tagPatternRegExp, 'u');
  const expectedRecord = getFixture('merged.json');

  const mergedRecord = createReducer({tagPattern, compareTagsOnly, compareWithoutIndicators, copyUnless, subfieldsMustBeIdentical, excludeSubfields, dropSubfields})(base, source);
  //debug(`***     mergedRecord: `, mergedRecord); //<--
  //debug(`***     mergedRecord,Strfy: `, JSON.stringify(mergedRecord.toObject())); //<--
  //debug(`***     expectedRecord: `, expectedRecord); //<--
  //debug(`***     expectedRecord,Strfy: `, JSON.stringify(expectedRecord)); //<--
  expect(mergedRecord).to.eql(expectedRecord);
}
