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

// Hakee basesta ja sourcesta copy.spec.js:ssä määritellyn patternin mukaiset kentät
export default (pattern) => (base, source) => {
  const baseFields = base.get(pattern);
  const sourceFields = source.get(pattern);
  return copyFields();

  // Jos basessa ei ole kenttää lainkaan, se kopioidaan sourcesta baseen
  // CopyFields tässä on nimellä copyMissingFields copy.spec.js:ssä
  function copyFields() {
    if (baseFields.length === 0) {
      sourceFields.forEach(f => base.insertField(f));
      return base;
    }
    return base;
  }
};
