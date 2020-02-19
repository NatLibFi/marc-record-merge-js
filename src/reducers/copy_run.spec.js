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
import {copyMissing, copyBoth, copyComplete} from './copy';

MarcRecord.setValidationOptions({subfieldValues: false});

const FIXTURES_PATH = path.join(__dirname, '../../test-fixtures/reducers/copy/');

describe('reducers', () => {
	const PATH_MISSING = path.join(FIXTURES_PATH, 'copyMissing');
	describe('Copy - Missing', () => {
		fs.readdirSync(PATH_MISSING).forEach(dir => {
			it(dir, () => {
				const fixturesPath = path.join(PATH_MISSING, dir);
				const base = parseRecord(fixturesPath, 'base.json');
				const source = parseRecord(fixturesPath, 'source.json');
				const pattern = new RegExp(fs.readFileSync(path.join(fixturesPath, 'pattern.txt'), 'utf8'));
				const expectedRecord = parseRecord(fixturesPath, 'merged.json');

				const mergedRecord = copyMissing(pattern)(base, source);

				expect(mergedRecord.equalsTo(expectedRecord)).to.equal(true);
			});
		});
	});

	const PATH_BOTH = path.join(FIXTURES_PATH, 'copyBoth');
	describe('Copy - Both', () => {
		fs.readdirSync(PATH_BOTH).forEach(dir => {
			it(dir, () => {
				const fixturesPath = path.join(PATH_BOTH, dir);
				const base = parseRecord(fixturesPath, 'base.json');
				const source = parseRecord(fixturesPath, 'source.json');
				const pattern = new RegExp(fs.readFileSync(path.join(fixturesPath, 'pattern.txt'), 'utf8'));
				const expectedRecord = parseRecord(fixturesPath, 'merged.json');

				const mergedRecord = copyBoth(pattern)(base, source);

				expect(mergedRecord.equalsTo(expectedRecord)).to.equal(true);
			});
		});
	});

	const PATH_COMPLETE = path.join(FIXTURES_PATH, 'copyComplete');
	describe('Copy - Complete', () => {
		fs.readdirSync(PATH_COMPLETE).forEach(dir => {
			it(dir, () => {
				const fixturesPath = path.join(PATH_COMPLETE, dir);
				const base = parseRecord(fixturesPath, 'base.json');
				const source = parseRecord(fixturesPath, 'source.json');
				const pattern = new RegExp(fs.readFileSync(path.join(fixturesPath, 'pattern.txt'), 'utf8'));
				const expectedRecord = parseRecord(fixturesPath, 'merged.json');

				const mergedRecord = copyComplete(pattern)(base, source);

				expect(mergedRecord.equalsTo(expectedRecord)).to.equal(true);
			});
		});
	});
});
