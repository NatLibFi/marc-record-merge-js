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

// Poistin test-utils.js:n ja laitoin sen sisällön tänne
// Julkaisuarkiston esimerkin mukaan

import chai from 'chai';
import fs from 'fs';
import path from 'path';
import {MarcRecord} from '@natlibfi/marc-record';
// CreateReducer-funktio on sama kuin copyFields copy.js:ssä
// Nimen voi muuttaa koska copy.js:ssä on export default ja vain yksi funktio.
// CreateReducer on geneerisempi nimi jota voi käyttää muissakin testeissä
// (siirretään myöhemmin testutilsiin?)
import createReducer from './copy';
import fixturesFactory, {READERS} from '@natlibfi/fixura';

MarcRecord.setValidationOptions({subfieldValues: false});

describe('reducers/copy', () => {
  const {expect} = chai;
  const fixturesPath = path.join(__dirname, '..', '..', 'test-fixtures', 'reducers', 'copy'); // Rakenne kopioitu julkaisuarkiston convert.spec.js:stä

  // Root on polku josta fixturesFactory löytää tiedostoja eli tässä fixturesPath/subDir
  // SubDir on numeroidut testihakemistot, 01 jne.
  fs.readdirSync(fixturesPath).forEach(subDir => {
    const {getFixture} = fixturesFactory({root: [fixturesPath, subDir], reader: READERS.JSON});
    it(subDir, () => {
      const baseTest = new MarcRecord(getFixture('base.json'));
      const sourceTest = new MarcRecord(getFixture('source.json'));
      // Ei marc-muodossa, u = unicode
      const patternTest = new RegExp(getFixture({components: ['pattern.txt'], reader: READERS.TEXT}), 'u');
      const expectedRecord = getFixture('merged.json');
      // MergedRecord on se jonka copy.js:n copyFields palauttaa
      const mergedRecord = createReducer(patternTest)(baseTest, sourceTest);
      expect(mergedRecord.toObject()).to.eql(expectedRecord);
    });

  });
});
