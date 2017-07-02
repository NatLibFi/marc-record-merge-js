/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * A configurable Javascript module for merging MARC records
 *
 * Copyright (c) 2015-2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-merge
 *
 * marc-record-merge is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *  
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

(function (root, factory) {
  
  'use strict';

  module.exports = factory(
    require('../test'),
    require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
    require('fs'),
    require('path')
  );
  
}(this, factory));

function factory(runTests, Promise, fs, path)
{

  function getResources(name_data, name_config)
  {
    
    var obj = {},
        path_base = path.join(path.dirname(module.filename), '..', 'suites');

    obj.config = JSON.parse(fs.readFileSync(path.join(path_base, 'config', name_config + '.json'), {
      encoding: 'utf8'
    }));
    
    obj.data = {
      preferred: fs.readFileSync(path.join(path_base, 'data', name_data, 'preferred'), {encoding: 'utf8'}),
      other: fs.readFileSync(path.join(path_base, 'data', name_data, 'other'), {encoding: 'utf8'})
    };

    if (fs.existsSync(path.join(path_base, 'data', name_data, 'merged'))) {
      obj.data.merged = fs.readFileSync(path.join(path_base, 'data', name_data, 'merged'), {encoding: 'utf8'});
    }

    return Promise.resolve(obj);

  }
  
  runTests(getResources);

}

