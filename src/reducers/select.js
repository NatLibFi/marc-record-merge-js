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
// Import {normalize} from 'normalize-diacritics';

export default (pattern) => (base, source) => {
  const debug = createDebugLogger('@natlibfi/marc-record-merge');
  const baseFields = base.get(pattern);
  debug(`baseFields: ${JSON.stringify(baseFields, undefined, 2)}`);
  const sourceFields = source.get(pattern);
  debug(`sourceFields: ${JSON.stringify(sourceFields, undefined, 2)}`);
  return selectFields();

  function selectFields() {
    const x = checkFieldType(baseFields);
    debug(`checkFieldType: ${x}`);
    const y = baseFields.map(checkTags);
    debug(`checkTags: ${y}`);

    /* Const z = baseFields.map(normalizeDiacritics);
    debug(`normalizeDiacritics for baseFields: ${z}`);
    const s = sourceFields.map(normalizeDiacritics);
    debug(`normalizeDiacritics for sourceFields: ${s}`);*/

    // Check whether the field is a data field
    function checkFieldType() {
      baseFields.forEach(field => {
        // Control fields are not handled here
        if ('value' in field) {
          return false;
        }
        // Data fields are passed on
        return true;
      });
    }

    // Base and source field tags must be equal
    function checkTags(baseField) {
      sourceFields.forEach(sourceField => {
        if (sourceField.tag === baseField.tag) {
          return true;
        }
        return false;
      });
    }

    /* Function normalizeDiacritics(field) {
      const a = field.subfields.map(normalize);
      debug(`normalizeDiacritics: ${a}`);
    }*/
  }
};

/**
 * Can be only used on data fields and should throw if attempted on control fields.
 * Tags must be equal. Indicators are not compared.
 * For checking the difference between both fields' subfields, normalize them first
 * (The order of the normalization is significant):
    Remove diacritics: The original code has this built-in but we should rather try an external package for this.
    Change to lowercase
    Replace sequential whitespace to a single whitespace character
    Remove punctuation characters:

    Equality comparison function

    This may be overridden when creating the reduces. Operates on normalized subfields.
    Has two built-in equality functions:
        Strict equality (Default)
            Subfield codes and values must be equal
        Subset comparison
            Subfield codes must be equal. Either subfield value must contain the other subfield's value.

Calculate the difference of subfields using the equality comparison function:
How many equal subfields are there in source for base and vice versa.
If they are equal (Both have equal number of subfields and there is a match for each subfields in both fields),
calculate which have "better" subfields and select the field which gets more points

    Calculate the number of characters in each normalized subfield values and sum them.
    The field that has a larger value is selected.

Otherwise check if the source field's subfields are a proper superset of the base field's subfields.
If they are, then select the source field.

    Being a proper superset here means that the source field's subfields contain
    all of the base field's subfields and more.
 */
