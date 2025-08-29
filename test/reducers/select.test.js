import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import createReducer, {subsetEquality} from '../../src/reducers/select.js';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';

MarcRecord.setValidationOptions({subfieldValues: false});
const debug = createDebugLogger('@natlibfi/marc-record-merge:reducers:select:test');
const debugData = debug.extend('data');

generateTests({
  callback,
  path: [import.meta.dirname, '..', '..', 'test-fixtures', 'reducers', 'select'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON,
    failWhenNotFound: false
  }
});

function callback({
  getFixture,
  tagPatternRegExp = false,
  expectedError = false,
  expectedToThrow = false,
  useSubsetEquality = false
}) {
  //  const base = new MarcRecord(getFixture('base.json'), {subfieldValues: false});
  //  const source = new MarcRecord(getFixture('source.json'), {subfieldValues: false});

  const base = getFixture('base.json');
  const source = getFixture('source.json');

  const tagPattern = new RegExp(tagPatternRegExp, 'u');
  const expectedRecord = getFixture('merged.json');
  const equalityFunction = useSubsetEquality ? subsetEquality : undefined;

  // Check expected error in testing
  if (expectedToThrow || expectedError) {
    debugData(`Expecting error: ${expectedToThrow}, ${expectedError}`);
    try {
      debug(`Trying to run merge`);
      const mergedRecord = createReducer({tagPattern, equalityFunction})(base, source);
      debugData(mergedRecord);
      throw new Error('Expected an error');
    } catch (err) {
      debug(`Got error: ${err.message}`);
      //assert.equal(typeof err, 'error');
      assert.ok(err instanceof Error);
      assert.match(err.message, new RegExp(expectedError, 'u'));
      //expect(err.payload).to.match(new RegExp(expectedError, 'u'));
      return;
    }
  }

  // select tests reducer where we have (base, source) non-object argument as input
  const mergedRecord = createReducer({tagPattern, equalityFunction})(base, source);
  assert.deepEqual(mergedRecord, expectedRecord);
}
