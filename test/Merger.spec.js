/*jshint mocha:true*/
"use strict";

var chai = require('chai');
var expect = chai.expect;
var Record = require('marc-record-js');
var Merger = require('../lib/marc-record-merge');
var path = require('path');
var fs = require('fs');

describe('Merger', function() {

	var suitesPath = path.resolve(__dirname, "suites");
	var suites = fs.readdirSync(suitesPath);
					
	suites.forEach(function(suite) {

		var p = path.resolve(suitesPath, suite);

		var config = require(path.resolve(p, 'config.js'));

		var merger = new Merger(config);

		var testFiles = fs.readdirSync(p)
			.filter(function(filename) {
				return filename.indexOf("rec_a") === 0;
			});

		var tests = testFiles.map(function(file) {
			var ra = file;
			var rb = file.replace("rec_a", "rec_b");
			var rto = file.replace("rec_a", "rec_to");

			return {
				description: "should merge (" + ra + "," + rb + ") => " + rto,
				record_a: readAndTrim(path.resolve(p,ra)),
				record_b: readAndTrim(path.resolve(p,rb)),
				expected_merged_record: readAndTrim(path.resolve(p,rto))
			};

		});

		tests.forEach(function(test) {

			it(test.description, function(done) {

				merger.merge(Record.fromString(test.record_a), Record.fromString(test.record_b))
				.then(function(merged) {

					var mergedRecord = new Record(merged);

					expect(mergedRecord.toString()).to.equal(test.expected_merged_record);
					done();

				}).done();

			});
		});

	});

});

function readAndTrim(filename) {
	var contents = fs.readFileSync(filename, 'utf8');
	return contents.trim();
}