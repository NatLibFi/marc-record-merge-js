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

export function mergeControlfield({pattern, indexes}) {
	return (base, source) => {
		base.get(pattern).forEach(baseField => {
			const sourceField = source.get(pattern).shift();

			if (sourceField) {
				const chars = baseField.value.split('');

				indexes.forEach(spec => {
					if (typeof spec === 'number') {
						chars[spec] = sourceField.value[spec];
					} else {
						const newChars = sourceField.value.substr(spec.offset, spec.length).split('');
						Array.prototype.splice.apply(chars, [spec.offset, spec.length].concat(newChars));
					}
				});

				baseField.value = chars.join('');
			}
		});

		return base;
	};
}
