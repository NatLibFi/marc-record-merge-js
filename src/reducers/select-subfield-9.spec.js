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

import fs from 'fs';
import path from 'path';
import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import {parseRecord} from './test-utils';
import {selectSubfield9} from './select-subfield-9';

MarcRecord.setValidationOptions({subfieldValues: false});

const FIXTURES_PATH = path.join(__dirname, '../../test-fixtures/reducers/select-subfield-9');

describe('reducers', () => {
	describe('select-subfield-9', () => {
		fs.readdirSync(FIXTURES_PATH).forEach(dir => {
			it(dir, () => {
				const fixturesPath = path.join(FIXTURES_PATH, dir);
				const base = parseRecord(fixturesPath, 'base.json');
				const source = parseRecord(fixturesPath, 'source.json');
				const pattern = new RegExp(fs.readFileSync(path.join(fixturesPath, 'pattern.txt'), 'utf8'));
				const expectedRecord = parseRecord(fixturesPath, 'merged.json');

				const mergedRecord = selectSubfield9(pattern)(base, source);

				expect(mergedRecord.equalsTo(expectedRecord)).to.equal(true);
			});
		});
	});
});
