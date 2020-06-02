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
  const sourceFields = source.get(pattern);
  return copyFields();

  // CopyFields tässä on nimellä createReducer copy.spec.js:ssä
  // Kaikki toiminnallisuus menee copyFieldsin sisään
  function copyFields() {
    // Testi 01: Jos basessa ei ole kenttää lainkaan, se kopioidaan sourcesta baseen
    if (baseFields.length === 0) {
      sourceFields.forEach(f => base.insertField(f));
      return base;
    }

    /* // MissingFieldsillä etsitään mitkä kentät puuttuvat
     const missingFields = sourceFields.filter(sourceField => {
      // Onko identtisiä kontrollikenttiä?
      // if value in sourceField kertoo, että kyseessä on kontrollikenttä,
      // koska vain kontrollikentillä on value suoraan fieldissä, datakentillä value on joka subfieldin alla
      if ('value' in sourceField) {
        const normalizedSourceField = normalize(sourceField);
        // Jos palauttaa false, ei löydy matchia eli ei ole identtisiä kontrollikenttiä
        return baseFields.some(isIdentical) === false;
      }

      // Jos basessa on epäidenttisiä kenttiä, ne kopioidaan uusina kenttinä
      return baseFields.some(baseField => {

      });

      // Marc-kentän normalisointi
      function normalize(field) {
        return field.value.toLowerCase().replace(/\s+/u, '');
      }

      // Ovatko normalisoitu base ja source identtisiä?
      // Jos funktio palauttaa true niin ovat, jos false niin eivät
      function isIdentical(baseField) {
        const normalizedBaseField = normalize(baseField);
        return normalizedSourceField === normalizedBaseField;
      }
    });
    // Sitten lisätään puuttuvat kentät eli missingFieldsin palauttama arvo?
    return base; */
  } // CopyFieldsin loppu
}; // Export defaultin loppu
