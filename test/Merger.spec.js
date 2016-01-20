/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Module for merging marc records
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

/*jshint mocha:true*/
"use strict";

var chai = require('chai');
var expect = chai.expect;
var Record = require('marc-record-js');
var Merger = require('../lib/marc-record-merge');
var path = require('path');
var fs = require('fs');

describe('Merger', function() {

	var DEBUG = process.env.NODE_ENV === "DEBUG";

	var suitesPath = path.resolve(__dirname, "suites");
	var suites = fs.readdirSync(suitesPath);
	

	var testSuites = suites.map(function(suite) {

			var p = path.resolve(suitesPath, suite);

			var config = require(path.resolve(p, 'config.js'));
			
			var testFiles = fs.readdirSync(p)
				.filter(function(filename) {
					return filename.indexOf("test") === 0;
				});

			var tests = testFiles.map(function(file) {

				var data = readAndTrim(path.resolve(p,file)).split("\n\n");

				return {
					description: data[0] + (DEBUG ? " (" + path.resolve(p,file) + ")" : ''),
					record_a: data[1],
					record_b: data[2],
					expected_merged_record: data[3],
					config: config
				};
			});

			return {
				name: suite,
				tests: tests
			};
	});


	var runOnly = false;
	testSuites.forEach(function(suite) {
		suite.tests.forEach(function(test) {
			if (test.description.charAt(0) == '!') {
				runOnly = true;
			}
		});
	});

	testSuites.forEach(function(suite) {

		describe(suite.name, function() {

			suite.tests.forEach(function(test) {

				if (runOnly && test.description.charAt(0) != '!') {
					return;
				}

				it(test.description, function(done) {

					var merger = new Merger(test.config);

					var recordB = Record.fromString(test.record_b);
					var recordA = Record.fromString(test.record_a);

					merger.merge(recordB, recordA)
					.then(function(merged) {

						var mergedRecord = new Record(merged);

						expect(mergedRecord.toString()).to.equal(test.expected_merged_record);

						// Also validate that the source records are not mutated!
						expect(recordB.toString(), '# Preferred record (second) has been mutated.').to.equal(test.record_b);
						expect(recordA.toString(), '# Other record (first) has been mutated.').to.equal(test.record_a);

						done();

					}).catch(function(err) {

						if (err.name == "AssertionError") {
							throw err;
						}

						
						expect(err.message).to.equal(test.expected_merged_record);
						
						// Also validate that the source records are not mutated!
						expect(recordB.toString(), '# Preferred record (second) has been mutated.').to.equal(test.record_b);
						expect(recordA.toString(), '# Other record (first) has been mutated.').to.equal(test.record_a);

						done();
					}).done();

				});
			});

		
		});

	});

});

function readAndTrim(filename) {
	var contents = fs.readFileSync(filename, 'utf8');
	return contents.trim();
}