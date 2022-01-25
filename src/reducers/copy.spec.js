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

import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import createReducer from './copy';
import generateTests from '@natlibfi/fixugen';

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

function callback({getFixture, tagPatternRegExp, compareTagsOnly = false, excludeSubfields = undefined, dropSubfields = undefined, enabled = true}) {
  if (!enabled) {
    console.log('TEST DISABLED!'); // eslint-disable-line no-console
    return;
  }
  const base = new MarcRecord(getFixture('base.json'));
  const source = new MarcRecord(getFixture('source.json'), {subfieldValues: false});
  const tagPattern = new RegExp(tagPatternRegExp, 'u');
  const expectedRecord = getFixture('merged.json');
  const mergedRecord = createReducer({tagPattern, compareTagsOnly, excludeSubfields, dropSubfields})(base, source);
  expect(mergedRecord.toObject()).to.eql(expectedRecord);
}
