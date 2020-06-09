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

// Hakee basesta ja sourcesta copy.spec.js:ssä määritellyn patternin (patternTest) mukaiset kentät
export default (pattern) => (base, source) => {
  const baseFields = base.get(pattern);
  // eslint-disable-next-line no-console
  console.log('baseFields: ');
  // eslint-disable-next-line no-console
  console.log(baseFields);
  const sourceFields = source.get(pattern);
  // eslint-disable-next-line no-console
  console.log('sourceFields: ');
  // eslint-disable-next-line no-console
  console.log(sourceFields);
  return copyFields();

  // CopyFields tässä on nimellä createReducer copy.spec.js:ssä
  // Kaikki toiminnallisuus menee copyFieldsin sisään
  function copyFields() {
    // Testi 01: Jos basessa ei ole kenttää lainkaan, se kopioidaan sourcesta baseen
    // Testissä 01 basessa ei ole lainkaan kenttää 010 (pattern) joten se kopioidaan sourcesta.
    // InsertField tulee MarcRecordista
    if (baseFields.length === 0) {
      sourceFields.forEach(f => base.insertField(f));
      // eslint-disable-next-line no-console
      console.log('base after test 01: ');
      // eslint-disable-next-line no-console
      console.log(base);
      return base;
    }
    // Jos basessa on jo kenttä, sourcen kenttä kopioidaan uutena basen kentän lisäksi
    // Eli merged.jsonissa voi olla useampi kappale samaa kenttää.

    // MissingFieldsillä etsitään mitkä kentät puuttuvat
    const missingFields = sourceFields.filter(sourceField => {
      // Testi 02: Onko identtisiä kontrollikenttiä?
      // If value in sourceField kertoo, että kyseessä on kontrollikenttä,
      // Koska vain kontrollikentillä on value suoraan fieldissä, datakentillä value on joka subfieldin alla
      if ('value' in sourceField) {
        // Jos isIdentical palauttaa falsen, ei löydy matchia eli ei ole identtisiä kontrollikenttiä
        // (eli koko if-blokin arvo on true)
        return baseFields.some(isIdentical) === false;
      }
      // Sourcen kentät kopioidaan uusina kenttinä baseen:
      // Testissä 02 kenttää 001 (pattern) tulee 2 kpl joilla on eri arvot
      return baseFields.some(baseField => {
        sourceFields.forEach(f => base.insertField(f));
        // eslint-disable-next-line no-console
        console.log('baseField after test 02: '); // Tähän ei koskaan mennä, miksi?
        // eslint-disable-next-line no-console
        console.log(baseField);
        return baseField; // MissingFieldsin pitäisi palauttaa tämä
      });

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
    }); // MissingFieldsin loppu
    // Sitten lisätään puuttuvat kentät eli missingFieldsin palauttama arvo?
    // eslint-disable-next-line no-console
    console.log('missingFields: ');
    // eslint-disable-next-line no-console
    console.log(missingFields); // missingFields palauttaa oikean arvon mutta sitä ei lisätä lopuksi baseen
    // eslint-disable-next-line no-console
    console.log('base lopussa: ');
    // eslint-disable-next-line no-console
    console.log(base);
    return base; // CopyFieldsin pitäisi palauttaa tämä
  } // CopyFieldsin loppu
}; // Export defaultin loppu
