/*jshint mocha:true*/

"use strict";

var chai = require('chai');
var expect = chai.expect;
var Record = require('marc-record-js');
var PreferredRecordSelector = require("../lib/preference.melinda");

describe('PreferenceMelinda', function() {

	var defaultTestRecord = new Record({
		leader: '00000cam^a22003017i^4500',
		fields: []
	});

	describe('specificFieldValue extractor', function() {
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendField(['LOW','','','a','ORG_A']);
		testRecord.appendField(['SID','','','b','ORG_B']);
		testRecord.appendField(['500','','','a','ORG_X']);
		var selector = new PreferredRecordSelector();

		it('should return 1 if record has ORG_A in LOW,a', function() {
			var contains_ORG_A = selector.extractSpecificFieldValue("LOW", ['a'], 'ORG_A');
			expect(contains_ORG_A(testRecord)).to.equal(1);

		});

		it('should return 1 if record has ORB_B in SID,b', function() {
			var contains_ORG_B = selector.extractSpecificFieldValue("SID", ['b'], 'ORG_B');
			expect(contains_ORG_B(testRecord)).to.equal(1);

		});

		it('should return 0 if record does not have specified value in field', function() {
			var contains_ORG_X = selector.extractSpecificFieldValue("LOW", ['a'], 'ORG_X');
			expect(contains_ORG_X(testRecord)).to.equal(0);
		});

	});

	describe('localOwnerCount extractor', function() {
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendField(['LOW','','','a','ORGANIZATION1']);
		testRecord.appendField(['LOW','','','a','ORGANIZATION2']);
		testRecord.appendField(['LOW','','','a','ORGANIZATION3']);
		testRecord.appendField(['SID','','','b','organization3']);
		testRecord.appendField(['SID','','','b','organization4']);

		it('should calculate local owners correctly from LOW and SID fields', function() {

			var selector = new PreferredRecordSelector();

			expect(selector.extractLocalOwnerCount(testRecord)).to.equal(4);

		});

	});

	describe('latestChangeByHuman extractor', function() {
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendControlField(["005","20141219114925.0"]);
		
		testRecord.appendField(["CAT","","","a","LOAD-HELKA","b","",  "c","20140812","l","FIN01","h","2333"]);
		testRecord.appendField(["CAT","","","a","LOAD-HELKA","b","",  "c","20111215","l","FIN01","h","0529"]);
		testRecord.appendField(["CAT","","","a","LOAD-FIX",  "b","30","c","20141219","l","FIN01","h","1145"]);
		testRecord.appendField(["CAT","","","a","CONV-ISBD", "b","",  "c","20120401","l","FIN01","h","2007"]);
		testRecord.appendField(["CAT","","","a","KVP1008",   "b","30","c","20131219","l","FIN01"]);
		testRecord.appendField(["CAT","","","a","KVP1008",   "b","30","c","20131215","l","FIN01"]);

		var selector = new PreferredRecordSelector();

		function isHumanFilter(userName) {
			if (userName.substr(0,5) === "LOAD-") {
				return false;
			}
			if (userName.substr(0,5) === "CONV-") {
				return false;
			}
			return true;
		}

		it('should find proper latest change from record with filter', function() {
			var latestChangeByHuman = selector.extractLatestChange(isHumanFilter);

			expect(latestChangeByHuman(testRecord)).to.equal("201312190000");

		});

		it('should find absolute latest change from record without filter', function() {
			var latestChange = selector.extractLatestChange();

			expect(latestChange(testRecord)).to.equal("201412191145");

		});
		it('should default to field 005 if there aren\'t any (unfiltered) CAT fields', function() {
			var latestChange = selector.extractLatestChange(function() { return false; });

			expect(latestChange(testRecord)).to.equal("201412191149");

		});
	});

	
	describe('recordAge extractor', function() {
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendControlField(["008","850506s1983^^^^xxu|||||||||||||||||eng||"]);
		var selector = new PreferredRecordSelector();

		it('should extract record age from 008', function() {
			expect(selector.extractRecordAge(testRecord)).to.equal('850506');
		});
	});

	describe('publicationYear extractor', function() {
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendControlField(["008","850506s1983^^^^xxu|||||||||||||||||eng||"]);
		var selector = new PreferredRecordSelector();

		it('should extract publication year from 008/07-11', function() {
			expect(selector.extractPublicationYear(testRecord)).to.equal('1983');
		});
	});

	describe('catalogingSourceFrom008 extractor', function() {
		
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendControlField(["008","850506s1983^^^^xxu|||||||||||||||||eng||"]);
		var selector = new PreferredRecordSelector();

		function setCatalogingSource(record, newLevel) {
			var field008 = record.fields.filter(function(field) { return field.tag === '008';})[0];

			field008.value = field008.value.substr(0,39) + newLevel + record.leader.substr(39+newLevel.length);
		}

		it('should extract cataloging source from 008', function() {
			expect(selector.extractCatalogingSourceFrom008(testRecord)).to.be.within(0,4);
		});

		it('should give 4 points for source #', function() {
			setCatalogingSource(testRecord, "#");
			expect(selector.extractCatalogingSourceFrom008(testRecord)).to.equal(4);
		});
		it('should give 3 points for source c', function() {
			setCatalogingSource(testRecord, "c");
			expect(selector.extractCatalogingSourceFrom008(testRecord)).to.equal(3);
		});
		it('should give 2 points for source d', function() {
			setCatalogingSource(testRecord, "d");
			expect(selector.extractCatalogingSourceFrom008(testRecord)).to.equal(2);
		});
		it('should give 1 points for source u', function() {
			setCatalogingSource(testRecord, "u");
			expect(selector.extractCatalogingSourceFrom008(testRecord)).to.equal(1);
		});
		it('should give 0 points for source |', function() {
			setCatalogingSource(testRecord, "|");
			expect(selector.extractCatalogingSourceFrom008(testRecord)).to.equal(0);
		});
		it('should give 0 points for source X (invalid)', function() {
			setCatalogingSource(testRecord, "X");
			expect(selector.extractCatalogingSourceFrom008(testRecord)).to.equal(0);
		});
	});
	
	describe('encodingLevel extractor', function() {
		var testRecord = new Record(defaultTestRecord);

		function setEncodingLevel(record, newLevel) {
			record.leader = record.leader.substr(0,17) + newLevel + record.leader.substr(17+newLevel.length);
		}
		it('should extract encoding level from leader', function() {

			var selector = new PreferredRecordSelector();

			var encodingLevel = selector.extractEncodingLevel(testRecord);

			expect(encodingLevel).to.be.within(0,5);

		});

		it('should give 4 points for encoding level #', function() {

			var selector = new PreferredRecordSelector();
			setEncodingLevel(testRecord,'#');

			expect(selector.extractEncodingLevel(testRecord)).to.equal(4);

		});

		it('should return null for encoding levels u,z', function() {

			var selector = new PreferredRecordSelector();
			setEncodingLevel(testRecord,'u');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(null);
			setEncodingLevel(testRecord,'z');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(null);


		});

		it('should give 3 point for encoding levels 1,2,4', function() {

			var selector = new PreferredRecordSelector();
			setEncodingLevel(testRecord,'1');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(3);
			setEncodingLevel(testRecord,'2');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(3);
			setEncodingLevel(testRecord,'4');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(3);

		});



		it('should give 2 point for encoding levels 5,7', function() {

			var selector = new PreferredRecordSelector();
			setEncodingLevel(testRecord,'5');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(2);
			setEncodingLevel(testRecord,'7');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(2);


		});

		it('should give 1 point for encoding levels 8,3', function() {

			var selector = new PreferredRecordSelector();
			setEncodingLevel(testRecord,'8');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(1);
			setEncodingLevel(testRecord,'3');
			expect(selector.extractEncodingLevel(testRecord)).to.equal(1);


		});

		it('should give null for encoding level K (invalid)', function() {

			var selector = new PreferredRecordSelector();
			setEncodingLevel(testRecord,'K');
			
			expect(selector.extractEncodingLevel(testRecord)).to.equal(null);

		});
	});

	describe('generateFeatureVector', function() {

		function setEncodingLevel(record, newLevel) {
			record.leader = record.leader.substr(0,17) + newLevel + record.leader.substr(17+newLevel.length);
		}


		var testRecord = new Record(defaultTestRecord);
		testRecord.appendControlField(["005","20141219114925.0"]);
		testRecord.appendControlField(["008","850506s1983^^^^xxu|||||||||||||||||eng||"]);
		testRecord.appendField(["CAT","","","a","LOAD-HELKA","b","",  "c","20140812","l","FIN01","h","2333"]);
		testRecord.appendField(["CAT","","","a","LOAD-HELKA","b","",  "c","20111215","l","FIN01","h","0529"]);
		testRecord.appendField(["CAT","","","a","LOAD-FIX",  "b","30","c","20141219","l","FIN01","h","1145"]);
		testRecord.appendField(["CAT","","","a","CONV-ISBD", "b","",  "c","20120401","l","FIN01","h","2007"]);
		testRecord.appendField(["CAT","","","a","KVP1008",   "b","30","c","20131219","l","FIN01"]);
		testRecord.appendField(["CAT","","","a","KVP1008",   "b","30","c","20131215","l","FIN01"]);
		testRecord.appendField(['LOW','','','a','FENNI']);
		testRecord.appendField(['SID','','','b','viola']);
		testRecord.appendField(['500','','','a','ORG_X']);

		var otherTestRecord = new Record(defaultTestRecord);
		otherTestRecord.appendControlField(["005","20131219114925.0"]);
		otherTestRecord.appendControlField(["008","870506s1983^^^^xxu|||||||||||||||||eng||"]);

		setEncodingLevel(otherTestRecord, 'u');
		setEncodingLevel(testRecord, '#');


		var selector = new PreferredRecordSelector();

		it('should generate proper feature vector', function() {
			var featureArray = [
				selector.extractEncodingLevel, 
				selector.extractCatalogingSourceFrom008,
				selector.extractRecordAge,
				selector.extractLocalOwnerCount,
				selector.extractLatestChange(),
				selector.extractSpecificLocalOwner("FENNI"),
				selector.extractSpecificLocalOwner("VIOLA"),

			];
			
			var vector = selector.generateFeatureVector(testRecord, featureArray);

			expect(vector).to.have.length(7);
			expect(vector).to.eql([4,0,"850506",2,"201412191145",1,1]);
		});

		it('should generate proper normalized vectors', function() {
			var featureArray = [
				selector.extractEncodingLevel, 
				selector.extractRecordAge,
				selector.extractLatestChange()
			];
			
			var vector1 = selector.generateFeatureVector(testRecord, featureArray);
			var vector2 = selector.generateFeatureVector(otherTestRecord, featureArray);

			expect(vector1).to.have.length(3);
			expect(vector1).to.eql([4, "850506","201412191145"]);

			expect(vector2).to.have.length(3);
			expect(vector2).to.eql([null, "870506","201312191149"]);

			var lexicalNormalizer = function(currentValue, otherValue) {
				return (currentValue > otherValue) ? 1 : 0;
			};
			var nullNormalizer = function(currentValue, otherValue) {
				if (otherValue === null) {
					if (currentValue !== null) {
						return 1;
					} else {
						return 0;
					}
				}
				return 0;
			};

			var normalizerArray = [
				nullNormalizer,
				lexicalNormalizer,
				lexicalNormalizer
			];
			selector.normalizeVectors(vector1, vector2, normalizerArray);

			expect(vector1).to.have.length(3);
			expect(vector1).to.eql([1, 0,1]);

			expect(vector2).to.have.length(3);
			expect(vector2).to.eql([0, 1,0]);

		});
		it('should handle invert normalizer correctly', function() {
			var invertNormalizer = function(current, other) {
				return other;
			};

			var vector1 = [0];
			var vector2 = [1];
			selector.normalizeVectors(vector1, vector2, [invertNormalizer]);
			expect(vector1).to.eql([1]);
			expect(vector2).to.eql([0]);

		});
	});

	describe('extractFieldCount', function() {
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendControlField(["005","20141219114925.0"]);
		testRecord.appendControlField(["008","850506s1983^^^^xxu|||||||||||||||||eng||"]);
		testRecord.appendField(["CAT","","","a","LOAD-HELKA","b","",  "c","20140812","l","FIN01","h","2333"]);
		testRecord.appendField(["CAT","","","a","LOAD-HELKA","b","",  "c","20111215","l","FIN01"]);
	
		var selector = new PreferredRecordSelector();

		it('should return the number of fields in the record', function() {
			expect(selector.extractFieldCount("CAT")(testRecord)).to.equal(2);
			expect(selector.extractFieldCount("005")(testRecord)).to.equal(1);
		});
		it('should return the number of field+subfields in the record', function() {
			expect(selector.extractFieldCount("CAT", ['h'])(testRecord)).to.equal(1);
			expect(selector.extractFieldCount("CAT", ['c'])(testRecord)).to.equal(2);
		});
	});

	describe('extractFieldLength', function() {
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendField(["250","","","a","8. völlig neu bearb. Aufl.", "6", "6880-02"]);
	
		var otherRecord = new Record(defaultTestRecord);
	
		var selector = new PreferredRecordSelector();

		it('should return the number of characters in the selected field', function() {
			expect(selector.extractFieldLength("250")(testRecord)).to.equal(33);
			
		});

		it('should return 0 if the field is missing', function() {
			expect(selector.extractFieldLength("250")(otherRecord)).to.equal(0);
		});
		
	});

	describe('extractNonFinnishHELKA', function() {
		var testRecordNotFinnishInHelka = new Record(defaultTestRecord);
		testRecordNotFinnishInHelka.appendControlField(["008","850506s1983^^^^xxu|||||||||||||||||eng||"]);
		testRecordNotFinnishInHelka.appendField(["LOW","","","a","HELKA"]);

		var testRecordNotFinnishNotHelka = new Record(defaultTestRecord);
		testRecordNotFinnishNotHelka.appendControlField(["008","850506s1983^^^^xxu|||||||||||||||||eng||"]);
	
		var testRecordInFinnishInHelka = new Record(defaultTestRecord);
		testRecordInFinnishInHelka.appendControlField(["008","850506s1983^^^^xxu|||||||||||||||||fin||"]);
		testRecordInFinnishInHelka.appendField(["LOW","","","a","HELKA"]);
	

		var selector = new PreferredRecordSelector();

		it('should return 1 if the record is in HELKA and is not in finnish', function() {
			expect(selector.extractNonFinnishHELKA(testRecordNotFinnishInHelka)).to.equal(1);
		});
		it('should return 0 if the record is not in HELKA and is not in finnish', function() {
			expect(selector.extractNonFinnishHELKA(testRecordNotFinnishNotHelka)).to.equal(0);
		});
		it('should return 0 if the record is in HELKA and is in finnish', function() {
			expect(selector.extractNonFinnishHELKA(testRecordInFinnishInHelka)).to.equal(0);
		});
	});

	describe('extractSpecificSingleLocalOwner', function() {
		
		var testRecord = new Record(defaultTestRecord);
		testRecord.appendField(["LOW","","","a","HELKA"]);
		testRecord.appendField(["LOW","","","a","VAARI"]);

		var otherRecord = new Record(defaultTestRecord);
		otherRecord.appendField(["LOW","","","a","VAARI"]);
		
		var selector = new PreferredRecordSelector();

		describe('it should return 1 if the specified owner is the only owner of the record', function() {
			expect(selector.extractSpecificSingleLocalOwner("VAARI")(otherRecord)).to.equal(1);
		});
		describe('it should return 0 if the specified owner is not the only owner of the record', function() {
			expect(selector.extractSpecificSingleLocalOwner("VAARI")(testRecord)).to.equal(0);
		});
	});

});
