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

const enums = Object.freeze({
	both: 'both',
	missing: 'missing',
	complete: 'complete'
});

export function copyMissing(pattern) {
	return copyBase(pattern, enums.missing);
}

export function copyBoth(pattern) {
	return copyBase(pattern, enums.both);
}

export function copyComplete(pattern) {
	return copyBase(pattern, enums.complete);
}

function copyBase(pattern, state) {
	return (base, source) => {
		// Artturi: should I use this to get single field or use regex from pattern as in other functions
		// This causes single result to be nested in array
		// const baseFields = base.getFields('010');
		const baseFields = base.get(pattern);
		const sourceFields = source.get(pattern);
		const mergedField = mergeFields();

		if (typeof (baseFields[0]) !== 'undefined') {
			base.removeField(baseFields[0]); // Remove unmerged field
		}

		if (mergedField) {
			base.insertField(mergedField); // Insert merged field
		}

		return base;

		function mergeFields() {
			let sourceField = sourceFields[0];
			let baseField = baseFields[0];

			// Saa tulla, jos puuttuu
			if (state === enums.missing && typeof (baseField) === 'undefined') {
				return sourceField;
			}

			// Saa tulla
			if (state === enums.both) {
				if (sourceField && sourceField.subfields) {
					sourceField.subfields = mergeSubfields();
					return sourceField;
				}

				return baseField;
			}

			// Verrataan > täydellisempi (enemmän osakenttiä) voittaa
			if (state === enums.complete) {
				if (typeof (sourceField) === 'undefined' || (baseField && sourceField.subfields.length <= baseField.subfields.length)) {
					return baseField;
				}

				return sourceField;
			}

			return baseField;

			function mergeSubfields() {
				let baseSubfields = [];
				if (baseField && baseField.subfields) {
					baseSubfields = clone(baseField.subfields);
				}

				if (sourceField && sourceField.subfields) {
					return baseSubfields.concat(sourceField.subfields);
				}

				return baseSubfields;
			}

			function clone(o) {
				return JSON.parse(JSON.stringify(o));
			}
		}
	};
}
