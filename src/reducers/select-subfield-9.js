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

import deepEql from 'deep-eql';

export function selectSubfield9(pattern) {
	return (base, source) => {
		const baseFields = base.get(pattern);
		const sourceFields = source.get(pattern).map(mergeFields);

		baseFields.forEach(f => base.removeField(f));
		sourceFields.forEach(f => base.insertField(f));

		return base;

		function mergeFields(sourceField) {
			const baseField = findMatch();

			if (baseField) {
				sourceField.subfields = mergeSubfields();
			}

			return sourceField;

			function findMatch() {
				const sourceFiltered = filterSubfields(sourceField);

				return baseFields
					.filter(f => f.tag === sourceField.tag && f.subfields.some(sf => sf.code === '9'))
					.find(baseField => {
						const baseFiltered = filterSubfields(baseField);
						return deepEql(baseFiltered, sourceFiltered);
					});
			}

			function filterSubfields(field) {
				const copy = clone(field);

				copy.subfields = copy.subfields.reduce((acc, sf) => {
					if (sf.code === '9') {
						return acc;
					}

					return acc.concat(sf);
				}, []);

				return copy;
			}

			function mergeSubfields() {
				const baseSubfields = clone(baseField.subfields);

				const otherSubfields = baseSubfields.filter(sf => sf.code !== '9');
				const mergedSubfields = get9Subfields();

				return mergedSubfields.concat(otherSubfields);

				function get9Subfields() {
					const a = sourceField.subfields.filter(sf => sf.code === '9');
					const b = baseSubfields.filter(sf => sf.code === '9');

					return a.concat(b).reduce((acc, newSf) => {
						if (acc.find(oldSf => oldSf.value === newSf.value)) {
							return acc;
						}

						return acc.concat(newSf);
					}, []);
				}
			}

			function clone(o) {
				return JSON.parse(JSON.stringify(o));
			}
		}
	};
}
