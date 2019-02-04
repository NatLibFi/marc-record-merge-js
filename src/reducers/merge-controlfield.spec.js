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
import {mergeControlfield} from './merge-controlfield';

MarcRecord.setValidationOptions({subfieldValues: false});

const FIXTURES_PATH = path.join(__dirname, '../../test-fixtures/reducers/merge-controlfield');

describe('reducers', () => {
	describe('merge-controlfield', () => {
		fs.readdirSync(FIXTURES_PATH).forEach(dir => {
			it(dir, () => {
				const fixturesPath = path.join(FIXTURES_PATH, dir);
				const base = parseRecord(fixturesPath, 'base.json');
				const source = parseRecord(fixturesPath, 'source.json');
				const parameters = parseParameters(fixturesPath);
				const expectedRecord = parseRecord(fixturesPath, 'merged.json');

				const mergedRecord = mergeControlfield(parameters)(base, source);

				expect(mergedRecord.equalsTo(expectedRecord)).to.equal(true);

				function parseParameters() {
					const file = path.join(fixturesPath, 'parameters.json');
					const parameters = JSON.parse(fs.readFileSync(file, 'utf8'));

					parameters.pattern = new RegExp(parameters.pattern);

					return parameters;
				}
			});
		});
	});
});
