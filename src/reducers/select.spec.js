import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import createReducer, {subsetEquality} from './select';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';

MarcRecord.setValidationOptions({subfieldValues: false});

generateTests({
  callback,
  path: [__dirname, '..', '..', 'test-fixtures', 'reducers', 'select'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON,
    failWhenNotFound: false
  }
});

function callback({
  getFixture,
  disabled = false,
  tagPatternRegExp = false,
  expectedError = false,
  useSubsetEquality = false
}) {
  if (disabled) {
    console.log('TEST DISABLED!'); // eslint-disable-line no-console
    return;
  }
  const base = new MarcRecord(getFixture('base.json'), {subfieldValues: false});
  const source = new MarcRecord(getFixture('source.json'), {subfieldValues: false});
  const tagPattern = new RegExp(tagPatternRegExp, 'u');
  const expectedRecord = getFixture('merged.json');
  const equalityFunction = useSubsetEquality ? subsetEquality : undefined;

  // Bypass expected error in testing
  if (expectedError) {
    expect(() => createReducer.to.throw(Error, 'control field'));
    return;
  }

  const mergedRecord = createReducer({tagPattern, equalityFunction})(base, source);
  expect(mergedRecord.toObject()).to.eql(expectedRecord);
}
