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
import createDebugLogger from 'debug';

// Hakee basesta ja sourcesta copy.spec.js:ssä määritellyn patternin (patternTest) mukaiset kentät
export default (pattern) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(pattern);
  debug(`baseFields: ${JSON.stringify(baseFields, undefined, 2)}`);
  const sourceFields = source.get(pattern);
  debug(`sourceFields: ${JSON.stringify(sourceFields, undefined, 2)}`);
  return copyFields();

  // CopyFields tässä on nimellä createReducer copy.spec.js:ssä
  // Kaikki toiminnallisuus menee copyFieldsin sisään
  function copyFields() {
    // Testi 01: Jos basessa ei ole kenttää lainkaan, se kopioidaan sourcesta baseen
    // Testissä 01 basessa ei ole lainkaan kenttää 010 (pattern) joten se kopioidaan sourcesta.
    // InsertField tulee MarcRecordista
    if (baseFields.length === 0) {
      sourceFields.forEach(f => base.insertField(f));
      debug(`base after test 01: ${JSON.stringify(base, undefined, 2)}`);
      return base;
    }
    // Jos basessa on jo kenttä, sourcen kenttä kopioidaan uutena basen kentän lisäksi
    // Eli merged.jsonissa voi olla useampi kappale samaa kenttää.

    const filterMissing = function(sourceField) {
      // Testi 02: Onko identtisiä kontrollikenttiä?
      // If value in sourceField kertoo, että kyseessä on kontrollikenttä,
      // Koska vain kontrollikentillä on value suoraan fieldissä, datakentillä value on joka subfieldin alla
      if ('value' in sourceField) {
        // Jos isIdentical palauttaa falsen, ei löydy matchia eli ei ole identtisiä kontrollikenttiä
        // (eli koko if-blokin arvo on true)
        debug('tarkistetaan kontrollikenttä');
        return baseFields.some(isIdentical) === false;
      }
      // Jos sourceFieldillä ei ole value-parametriä suoraan fieldissä, kyseessä on datakenttä.
      // Testi 04: Onko identtisiä datakenttiä?

      // 24.6. Tarkista mikä on oikea syntaksi jotta tämä osuus toimii

      // The tag, ind1 & ind2 must match with strict string equality
      // The number of subfields must be equal.
      if (('tag' in sourceField) === ('tag' in baseFields) &&
      ('ind1' in sourceField) === ('ind1' in baseFields) &&
      ('ind2' in sourceField) === ('ind2' in baseFields) &&
      (sourceField.subfields.length === baseFields.subfields.length)) {
        // Tähän väliin osakenttien tarkistus?
        // Each subfield must find an identical pair in the another record.
        // The code and value must match with strict string equality.
        // The order of subfield does not matter.

      }



      debug(`filterMissingin arvo on: ${JSON.stringify(filterMissing, undefined, 2)}`);
      return filterMissing; // Palauttaa ei-identtiset kentät

      // Apufunktiot:
      // Marc-kentän normalisointi
      function normalize(field) {
        return field.value.toLowerCase().replace(/\s+/u, '');
      }
      // Ovatko normalisoitu base ja source identtisiä?
      // Jos funktio palauttaa true niin ovat, jos false niin eivät
      function isIdentical(baseField) {
        const normalizedBaseField = normalize(baseField);
        const normalizedSourceField = normalize(sourceField);
        return normalizedSourceField === normalizedBaseField;
      }
    }; // FilterMissingin loppu

    // MissingFieldsillä etsitään mitkä kentät puuttuvat
    const missingFields = sourceFields.filter(filterMissing);

    debug(`missingFields: ${JSON.stringify(missingFields, undefined, 2)}`);
    // Testi 03: Jos on puuttuvia kenttiä, ne lisätään uusina baseen (kontrollikentät)
    missingFields.forEach(f => base.insertField(f));
    debug(`base lopussa pitää olla sama kuin merged: ${JSON.stringify(base, undefined, 2)}`);
    return base; // CopyFieldsin pitäisi palauttaa tämä
  } // CopyFieldsin loppu
}; // Export defaultin loppu
