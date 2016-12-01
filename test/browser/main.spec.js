/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * A configurable Javascript module for merging MARC records
 *
 * Copyright (c) 2015-2016 University Of Helsinki (The National Library Of Finland)
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

  define([
    '../test',
    'es6-polyfills/lib/polyfills/promise',
    'require'
  ], factory);
  
}(this, factory));

function factory(runTests, Promise, require)
{

  function xhrGetPromise(path)
  {
    return new Promise(function(resolve, reject) {

      var xhr = new XMLHttpRequest();
      xhr.open('GET', path);

      xhr.addEventListener('load', function() {
        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 404) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(xhr.status+' : '+xhr.statusText));
        }
      });
      xhr.addEventListener('error', function() {
        reject(new Error(xhr.status+' : '+xhr.statusText));
      });
      
      xhr.send(null);

    });
  }

  function getResources(name_data, name_config)
  {
    return Promise.all([
      xhrGetPromise('/base/test/suites/config/' + name_config + '.json').then(function(data) {return JSON.parse(data);}),
      xhrGetPromise('/base/test/suites/data/' + name_data + '/preferred'),
      xhrGetPromise('/base/test/suites/data/' + name_data + '/other'),
      xhrGetPromise('/base/test/suites/data/' + name_data + '/merged'),
    ]).then(function(resources) {

      var obj = {
        config: resources[0],
        data: {
          preferred: resources[1],
          other: resources[2]
        }
      };

      if (resources[3]) {
        obj.data.merged = resources[3];
      }

      return obj;

    });
  }

  runTests(getResources);

}

