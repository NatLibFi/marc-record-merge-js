/*jshint mocha:true*/
"use strict";

var chai = require('chai');
var expect = chai.expect;
var Record = require('marc-record-js');
var MergeUtilsMelinda = require('../lib/mergeutils.melinda');
var path = require('path');
var fs = require('fs');

describe('Merger', function() {

	var DEBUG = process.env.NODE_ENV === "DEBUG";
	
	var suitesPath = path.resolve(__dirname, "mergeutils");
	var suites = fs.readdirSync(suitesPath);
					
	suites.forEach(function(suite) {

		describe(suite, function() {

			var p = path.resolve(suitesPath, suite);

			var testFiles = fs.readdirSync(p)
				.filter(function(filename) {
					return filename.indexOf("test") === 0;
				});

			var tests = testFiles.map(function(file) {

				var data = readAndTrim(path.resolve(p,file)).split("\n\n");

				return {
					description: data[0] + (DEBUG ? " (" + path.resolve(p,file) + ")" : ''),
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

					MergeUtilsMelinda.applyPostMergeModifications(
						Record.fromString(test.record_other), 
						Record.fromString(test.record_preferred),
						postMergeModifiedRecord
					);

					removeField(postMergeModifiedRecord, '583');
					

					expect(postMergeModifiedRecord.toString()).to.equal(test.expected_post_modified_merged_record);

					done();

				});
			});

		
		});

	});

});

function removeField(record, tag) {
	record.fields = record.fields.filter(function(field) {
		return field.tag !== tag;
	});
}

function readAndTrim(filename) {
	var contents = fs.readFileSync(filename, 'utf8');
	return contents.trim();
}

function formatDate(date) {
    var tzo = -date.getTimezoneOffset();
    var dif = tzo >= 0 ? '+' : '-';

    return date.getFullYear() +
        '-' + pad(date.getMonth()+1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);

    function pad(num) {
		var str = num.toString();
		while(str.length < 2) {
			str = "0" + str;
		}
		return str;
    }
}