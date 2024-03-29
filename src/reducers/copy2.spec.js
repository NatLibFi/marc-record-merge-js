import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import createReducer from './copy';
import generateTests from '@natlibfi/fixugen';

//import createDebugLogger from 'debug'; // <---
//const debug = createDebugLogger('@natlibfi/marc-record-merge/copy.spec.js'); // <---

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
  compareWithoutTag = false,
  compareWithoutIndicators = false,
  compareWithoutIndicator1 = false,
  compareWithoutIndicator2 = false,
  subfieldsMustBeIdentical = false,
  copyUnless = undefined,
  excludeSubfields = undefined,
  dropSubfields = undefined,
  swapSubfieldCode = [],
  swapTag = [],
  doNotCopyIfFieldPresent = false
}) {
  const base = getFixture('base.json');
  const source = getFixture('source.json');
  const tagPattern = new RegExp(tagPatternRegExp, 'u');
  const expectedRecord = getFixture('merged.json');

  const merged = createReducer({
    tagPattern, compareTagsOnly, compareWithoutTag, compareWithoutIndicators, compareWithoutIndicator1, compareWithoutIndicator2,
    copyUnless, subfieldsMustBeIdentical, excludeSubfields,
    dropSubfields, swapSubfieldCode, swapTag,
    doNotCopyIfFieldPresent
  })({base, source});
  //debug(`***     mergedRecord: `, mergedRecord); //<--
  //debug(`***     mergedRecord,Strfy: `, JSON.stringify(mergedRecord)); //<--
  //debug(`***     expectedRecord: `, expectedRecord); //<--
  //debug(`***     expectedRecord,Strfy: `, JSON.stringify(expectedRecord)); //<--
  expect(merged.constructor.name).not.to.eql('MarcRecord');
  expect(merged.constructor.name).to.eql('Object');
  expect(merged).to.eql(expectedRecord);
}
