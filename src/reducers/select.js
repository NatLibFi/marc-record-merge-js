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
import {normalizeSync} from 'normalize-diacritics';

export default (pattern) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFieldsFromPattern = base.get(pattern);
  const sourceFieldsFromPattern = source.get(pattern);
  return selectFields();

  function selectFields() {
    // Check that all fields are data fields
    // Test 01: The field is a control field (contains 'value')
    const baseFields = checkFieldType(baseFieldsFromPattern);
    debug(`baseFields: ${JSON.stringify(baseFields, undefined, 2)}`);
    const sourceFields = checkFieldType(sourceFieldsFromPattern);
    debug(`sourceFields: ${JSON.stringify(sourceFields, undefined, 2)}`);
      
    // Test 02: If there are multiple fields, the base field is returned unmodified
    if (baseFields.length > 1 || sourceFields.length > 1) {
      debug(`Multiple fields in base or source`);
      return base;
    }

    // Check that the base and source tags are equal
    // Test 03: Base and source tags are equal for one field
    // Test 04: Base and source tags are not equal 
    // Note: to check this, the pattern has to allow two tags, otherwise the unequal tag does not even pass source.get(pattern)
   
    if (checkTags(baseFields, sourceFields) === false) {
      debug(`Tags are not equal`);
      return base;
    }
    
    // Test 05: Normalize subfields of both base and source fields in order:
    // 1. Remove diacritics
    // 2. Change to lowercase
    // 3. Trim whitespace at ends and replace sequential whitespace with a single whitespace character
    // 4. Remove punctuation characters
    
    // Miten pannaan normalisoidut valuet takaisin fieldiin oikeille paikoille? 
    // Eli siis mappauksen logiikka "takaperin"? Jotta saadaan oikean muotoinen merged.json
    const baseValues =
      baseFields.map(normalizeDiacritics)
      .map(changeToLowerCase)
      .map(removeWhitespace)
      .map(removePunctuation);
    debug(`baseValues: ${JSON.stringify(baseValues, undefined, 2)}`);
    //const baseFieldsNormalized = sama rakenne kuin baseFields, mutta normalisoidut valuet
    // Vai pitääkö koko normalisointi hoitaa baseFields-tyyppisen rakenteen sisällä (miten?)
    // sen sijaan että irrotan values-arrayn erikseen kuten olen tässä tehnyt?
    // Eli jotenkin päästä käsiksi suoraan [ { [ {tänne} ] } ] muuttamatta koko rakennetta?

    const sourceValues = 
      sourceFields.map(normalizeDiacritics)
      .map(changeToLowerCase)
      .map(removeWhitespace)
      .map(removePunctuation);
    debug(`sourceValues: ${JSON.stringify(sourceValues, undefined, 2)}`);

    // Compare equality of normalized subfields:
    // 1. Default: Strict equality (subfield values and codes are equal)
    // 2. Subset comparison (equal codes, one subfield value may be a subset of the other)

    //const mergedFields = baseFields; // parhaat kentät mergataan
    //debug(`mergedFields: ${JSON.stringify(selectedFields, undefined, 2)}`);

    // Functions:

    // Check that all fields are data fields
    function checkFieldType(fields) {
      const checkedFields = fields.map(field => {
        // Control fields are not handled here
        if ('value' in field) {
          throw new Error('Invalid control field, expected data field');
        }
        // Data fields are passed on
        return field;
      });
      return checkedFields;
    }

    // Base and source field tags must be equal
    function checkTags(baseFields, sourceFields) {
      // At this point we know that both base and source have only one field, 
      // since they were checked for multiple fields earlier
      const baseTag = JSON.stringify(baseFields.map(field => field.tag));
      debug(`baseTag: ${baseTag} is ${typeof baseTag}`);
      const sourceTag = JSON.stringify(sourceFields.map(field => field.tag));
      debug(`sourceTag: ${sourceTag} is ${typeof sourceTag}`);
      if (baseTag !== sourceTag) {
        return false;
      }
      return true;
    }
    
    function normalizeDiacritics(field) {
      const values = field.subfields.map(subfield => subfield.value);
      // "  #?    Héllö    &* wôRld %   " --> "  #?    Hello    &* woRld %   "
      return values.map(value => normalizeSync(value));
    }

    function changeToLowerCase(values) {
      // "  #?    Hello    &* woRld %   " --> "  #?    hello    &* world %   "
      return values.map(value => value.toLowerCase());
    }

    function removeWhitespace(values) {
      // "  #?    hello    &* world %   " --> "#? hello &* world %"
      return values.map(value => value.replace(/\s+/g, ' ').trim());    
     }

    function removePunctuation(values) {
      // "#? hello &* world %" --> "hello world"
      const regexp = /[.,\-/#!$%\^&*;:{}=_`~()[\]]/g;
      // Whitespace removed again at the end to get rid of possible new whitespace caused by removing punctuation marks
      // Without this, "#? hello &* world %" would be returned here as " hello  world "
      return values.map(value => value.replace(regexp, '').replace(/\s+/g, ' ').trim());    
    }

  return mergedFields;
  }
};

