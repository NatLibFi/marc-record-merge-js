import merger, {Reducers} from './index';
import {inspect} from 'util';
import createDebugLogger from 'debug';
import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'index'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: false,
    reader: READERS.JSON
  }
});

function callback({getFixture, reducerConfigs = []}) {
  const base = new MarcRecord(getFixture('base.json'), {subfieldValues: false});
  const source = new MarcRecord(getFixture('source.json'), {subfieldValues: false});
  const expectedRecord = getFixture('merged.json');

  const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:index:test');
  const debugData = debug.extend('data');

  const testReducerConfigs = reducerConfigs;
  const reducers = [...testReducerConfigs.map(conf => Reducers.copy(conf))];

  debugData(`Reducers: ${inspect(reducers, {colors: true, maxArrayLength: 10, depth: 8})})}`);

  const result = merger({base, source, reducers});

  debug(`Merge result is: ${result.constructor.name}`);
  debugData(`${JSON.stringify(result)}`);

  // Use either result.base or a plain result as resultRecord
  // It can also be a MarcRecord or a plain object
  const resultRecord = result.base || result;
  const resultRecordToRecord = new MarcRecord(resultRecord, {subfieldValues: false});
  expect(resultRecordToRecord.toObject()).to.eql(expectedRecord);


}
