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

import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import merge from './merge';
import {Reducers} from './index';

MarcRecord.setValidationOptions({subfieldValues: false});

describe('index', () => {
  it('Should merge two records', () => {
    const base = new MarcRecord({
      leader: '00000ccm a22004574i 4500',
      fields: [
        {
          tag: '245', ind1: '0', ind2: '0',
          subfields: [
            {
              code: 'a',
              value: 'Foobar'
            }
          ]
        }
      ]
    });

    const source = new MarcRecord({
      leader: '00000ccm a22004574i 4500',
      fields: [{tag: '008', value: '160311s2016||||fi ||z|  |||||||| | fin|c'}]
    });

    const reducers = [
      (base, source) => {
        base.insertField(source.fields[0]);
        return base;
      },
      base => {
        if (base.get(/^008$/u).length > 0) {
          base.insertField({
            tag: '001',
            value: '12345'
          });
          return base;
        }
        return base;
      }
    ];

    const expectedRecord = new MarcRecord({
      leader: '00000ccm a22004574i 4500',
      fields: [
        {tag: '001', value: '12345'},
        {tag: '008', value: '160311s2016||||fi ||z|  |||||||| | fin|c'},
        {
          tag: '245', ind1: '0', ind2: '0',
          subfields: [
            {
              code: 'a',
              value: 'Foobar'
            }
          ]
        }
      ]
    });

    const mergedRecord = merge({base, source, reducers});

    expect(mergedRecord.equalsTo(expectedRecord)).to.equal(true);
  });

  it('Custom merge of two records - control fields', () => {
    const parametersControl = {
      pattern: '^008$',
      indexes: [39]
    };

    const parametersSubfield9 = /^500$/u;
    const parametersCopy = /^015$/u;

    const base = new MarcRecord({
      leader: '00000ccm a22004574i 4500',
      fields: [
        {tag: '008', value: '160311s2016||||fi ||z|  |||||||| | fin|c'},
        {
          tag: '015',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'B67-20987'
            }
          ]
        },
        {
          tag: '500',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: '9',
              value: 'FENNI<KEEP>'
            },
            {
              code: 'a',
              value: 'blah'
            }
          ]
        }
      ]
    });

    const source = new MarcRecord({
      leader: '00000ccm a22004574i 4500',
      fields: [
        {tag: '008', value: '160311s2016||||fi ||z|  |||||||| | fin|d'},
        {
          tag: '015',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'B67-20988'
            },
            {
              code: 'q',
              value: 'pbk'
            }
          ]
        },
        {
          tag: '500',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: '9',
              value: 'VIOLA<KEEP>'
            },
            {
              code: 'a',
              value: 'blah'
            }
          ]
        }
      ]
    });

    const reducers = [
      (base, source) => Reducers.mergeControlfield(parametersControl)(base, source),
      (base, source) => Reducers.selectSubfield9(parametersSubfield9)(base, source),
      (base, source) => Reducers.copyComplete(parametersCopy)(base, source)
    ];

    const expectedRecord = new MarcRecord({
      leader: '00000ccm a22004574i 4500',
      fields: [
        {tag: '008', value: '160311s2016||||fi ||z|  |||||||| | fin|d'},
        {
          tag: '015',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'B67-20988'
            },
            {
              code: 'q',
              value: 'pbk'
            }
          ]
        },
        {
          tag: '500',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: '9',
              value: 'VIOLA<KEEP>'
            },
            {
              code: '9',
              value: 'FENNI<KEEP>'
            },
            {
              code: 'a',
              value: 'blah'
            }
          ]
        }
      ]
    });

    const mergedRecord = merge({base, source, reducers});

    expect(mergedRecord.equalsTo(expectedRecord)).to.equal(true);
  });
});
