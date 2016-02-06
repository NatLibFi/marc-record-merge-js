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

    function requirePromise(path)
    {
	return new Promise(function(resolve, reject) {
	    require(
		[path],
		function(module) {
		    resolve(module);
		},
		function (error) {		    
		    return new RegExp('/merged$').test(path) === true && error.xhr.status === 404 ? resolve() : reject(error);
		}
	    );
	});
    }

    function getResources(name_data, name_config)
    {
	return Promise.all([
	    requirePromise('json!../suites/config/' + name_config + '.json'),
	    requirePromise('text!../suites/data/' + name_data + '/preferred'),
	    requirePromise('text!../suites/data/' + name_data + '/other'),
	    requirePromise('text!../suites/data/' + name_data + '/merged'),
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

