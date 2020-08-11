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
// Base ja source ovat MarcRecord-objekteja
export default (pattern) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  // Get tulee MarcRecordista
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
    // SourceField käsittelee vuorotellen jokaisen patternin mukaisen kentän sourcesta

    const filterMissing = function(sourceField) {
      // Testi 02: Onko identtisiä kontrollikenttiä?
      // If value in sourceField kertoo, että kyseessä on kontrollikenttä,
      // Koska vain kontrollikentillä on 'value'-stringi suoraan fieldissä, datakentillä joka subfieldin alla
      if ('value' in sourceField) {
        // Jos isIdentical palauttaa falsen, ei löydy matchia eli ei ole identtisiä kontrollikenttiä
        // (eli koko if-blokin arvo on true)
        debug('tarkistetaan kontrollikentät');
        debug(`sourceField kontrollikentät on: ${JSON.stringify(sourceField, undefined, 2)}`);
        return baseFields.some(isIdenticalControlField) === false;
      }

      // Jos sourceFieldillä on subfields-osio, kyseessä on datakenttä.
      // Testi 04: identtiset datakentät basessa ja sourcessa
      // Testi 05: erilaisia datakenttiä basessa ja sourcessa
      if ('subfields' in sourceField) {
        debug('tarkistetaan datakentät');
        debug(`sourceField datakentät on: ${JSON.stringify(sourceField, undefined, 2)}`);
        return baseFields.some(isIdenticalDataField) === false;
      }
      debug(`filterMissingin arvo on: ${JSON.stringify(filterMissing, undefined, 2)}`);
      return filterMissing; // Palauttaa ei-identtiset kentät

      // Apufunktiot:
      // Kontrollikentän normalisointi
      function normalizeControlField(field) {
        debug(`kontrollikentän field.value on ${field.value}`);
        return field.value.toLowerCase().replace(/\s+/u, '');
      }
      // Ovatko normalisoitu base ja source identtisiä?
      // Jos funktio palauttaa true niin ovat, jos false niin eivät
      function isIdenticalControlField(baseField) {
        const normalizedBaseField = normalizeControlField(baseField);
        const normalizedSourceField = normalizeControlField(sourceField);
        return normalizedSourceField === normalizedBaseField;
      }
      // Ovatko datakentät identtisiä? tag, ind1, ind2 ja kaikki osakentät pitää olla identtiset.
      function isIdenticalDataField(baseField) {
        if (sourceField.tag === baseField.tag &&
          sourceField.ind1 === baseField.ind1 &&
          sourceField.ind2 === baseField.ind2 &&
          sourceField.subfields.length === baseField.subfields.length) {
          // SourceFieldin ja baseFieldin kaikissa subfieldeissä pitää olla samat code ja value
          // Osakenttien normalisointi
          debug('tarkistetaan datakenttien sisällöt');
          return baseField.subfields.every(isIdenticalSubfield);
        }
        function normalizeSubfield(subfield) {
          const x = subfield.value.toLowerCase().replace(/\s+/u, '');
          debug(`normalizeSubfield: ${x}`);
          return x;
        }
        function isIdenticalSubfield(baseSub) {
          const normBaseSub = normalizeSubfield(baseSub);
          return sourceField.subfields.some(sourceSub => {
            const normSourceSub = normalizeSubfield(sourceSub);
            return normSourceSub === normBaseSub;
            });
        }
      }; //isIdenticalDatafieldin loppu
    }; // FilterMissingin loppu


    // MissingFieldsillä etsitään mitkä kentät puuttuvat basesta
    const missingFields = sourceFields.filter(filterMissing);
    debug(`missingFields: ${JSON.stringify(missingFields, undefined, 2)}`);
    // Testi 03: Lisätään puuttuva kontrollikenttä uutena baseen
    // Testi 05: Lisätään puuttuva datakenttä uutena baseen
    missingFields.forEach(f => base.insertField(f));
    debug(`base lopussa pitää olla sama kuin merged: ${JSON.stringify(base, undefined, 2)}`);
    return base; // CopyFieldsin pitäisi palauttaa tämä

  } // CopyFieldsin loppu
}; // Export defaultin loppu
