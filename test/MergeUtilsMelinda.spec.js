/*jshint mocha:true*/
"use strict";

var chai = require('chai');
var expect = chai.expect;
var Record = require('marc-record-js');
var MergeUtilsMelinda = require('../lib/mergeutils.melinda');
var path = require('path');
var fs = require('fs');

describe('Merger', function() {

	var suitesPath = path.resolve(__dirname, "mergeutils");
	var suites = fs.readdirSync(suitesPath);
					
	suites.forEach(function(suite) {

		describe(suite, function() {

			var p = path.resolve(suitesPath, suite);

			var config = require(path.resolve(p, 'config.js'));

			var testFiles = fs.readdirSync(p)
				.filter(function(filename) {
					return filename.indexOf("test") === 0;
				});

			var tests = testFiles.map(function(file) {

				var data = readAndTrim(path.resolve(p,file)).split("\n\n");

				return {
					description: data[0],
					record_other: data[1],
					record_preferred: data[2],
					expected_post_modified_merged_record: data[3]
				};
			});

			var runOnly = tests.filter(function(test) {
				return test.description.charAt(0) == '!';
			});

			if (runOnly.length > 0) {
				tests = runOnly;
			}

			tests.forEach(function(test) {

				it(test.description, function(done) {

					var postMergeModifiedRecord = Record.fromString(test.record_preferred);

					MergeUtilsMelinda.postMerge(
						Record.fromString(test.record_other), 
						Record.fromString(test.record_preferred),
						postMergeModifiedRecord
					);

					expect(postMergeModifiedRecord.toString()).to.equal(test.expected_post_modified_merged_record);

					done();

				});
			});

		
		});

	});

});

function readAndTrim(filename) {
	var contents = fs.readFileSync(filename, 'utf8');
	return contents.trim();
}