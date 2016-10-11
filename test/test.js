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

    if (typeof define === 'function' && define.amd) {
	define(['chai', 'marc-record-js', '../lib/main'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('chai'), require('marc-record-js'), require('../lib/main'));
    }

}(this, factory));

function factory(chai, MarcRecord, mergeFactory)
{

    'use strict';

    return function(getResources)
    {

	function runSuite(name_data, name_config, doneCallback, plugins)
	{
	    try {
		getResources(name_data, name_config).then(function(resources) {

		    var record_preferred, record_other, record_merged;

		    try {

			record_preferred = MarcRecord.fromString(resources.data.preferred);
			record_other = MarcRecord.fromString(resources.data.other);
			record_merged = mergeFactory(resources.config, plugins)(record_preferred, record_other);
			
			expect(record_merged.toString()).to.equal(resources.data.merged);
			expect(record_preferred.toString()).to.equal(resources.data.preferred);
			expect(record_other.toString()).to.equal(resources.data.other);

			doneCallback();

		    } catch (e_inner) {
			doneCallback(e_inner);
		    }

		}, function (error) {
		    doneCallback(error);
		});
	    } catch (e) {
		doneCallback(e);
	    }
	}

	var expect = chai.expect;

	describe('factory', function() {
	    
	    it('Should be a function', function() {
		expect(mergeFactory).to.be.a('function');
	    });
	    
	    it('Should return a function', function() {
		expect(function() {

		    mergeFactory({
			fields: []
		    });

		}).to.be.a('function');
	    });
	    
	    describe('merge', function() {

		it("Should be copied from other record if it's not present in preferred record", function(done) {
		    runSuite('1', '1to3', done);
		});

		it("Should be kept if missing from from other record", function(done) {
		    runSuite('2', '1to3', done);
		});

		it("Should take it from preferred record if both records have it", function(done) {
		    runSuite('3', '1to3', done);
		});

		it("Should use the field with more information is used", function(done) {
		    runSuite('4', '4to26', done);
		});
		it("Should keep only one copy of identical fields in the merged record", function(done) {
		    runSuite('5', '4to26', done);
		});
		it("Should only copy fields that are configured", function(done) {
		    runSuite('6', '4to26', done);
		});
		it("Should copy whole field instead of merging specifically configured subfields if the fields are not identical", function(done) {
		    runSuite('7', '4to26', done);
		});
		it("Should move specifically configured subfields if the fields are identical (sans configured subfields)", function(done) {
		    runSuite('8', '4to26', done);
		});
		it("Should normalize for comparison but preserve diacritics in copy action", function(done) {
		    runSuite('9', '4to26', done);
		});
		it("Should normalize for comparison but preserve diacritics in move subfields action", function(done) {
		    runSuite('10', '4to26', done);
		});
		it("Should normalize case for comparison but preserve it in copy action", function(done) {
		    runSuite('11', '4to26', done);
		});
		it("Should normalize punctuation for comparison but preserve it in move subfields action", function(done) {
		    runSuite('12', '4to26', done);
		});
		it("Should handle controlfields correctly", function(done) {
		    runSuite('13', '4to26', done);
		});
		it("Should select better field from preferred record", function(done) {
		    runSuite('14', '4to26', done);
		});
		it("Should select better field from other record", function(done) {
		    runSuite('15', '4to26', done);
		});
		it("Should select better field from other record, making comparison without 'compareWithout' subfields.", function(done) {
		    runSuite('16', '4to26', done);
		});
		it("Should move only one instance of 'compareWithout' fields to merged", function(done) {
		    runSuite('17', '4to26', done);
		});
		it("Should select better field from preferred record, making comparison without 'compareWithout' subfields.", function(done) {
		    runSuite('18', '4to26', done);
		});
		it("Should handle e subfields in field 700 with compareWithout setting.", function(done) {
		    runSuite('19', '4to26', done);
		});
		it("Should handle e subfields with compareWithout setting.", function(done) {
		    runSuite('20', '4to26', done);
		});
		it("Should not mess up any fields.", function(done) {
		    runSuite('21', '4to26', done);
		});
		it("Should not mess up any fields.", function(done) {
		    runSuite('22', '4to26', done);
		});
		it("Should use field from other record if the preferred record is proper subset. Note that only fields that have been marked in config will be handled.", function(done) {
		    runSuite('23', '4to26', done);
		});
		it("Should compare without indicators if compareWithoutIndicators options is true. Selects the field with most indicators.", function(done) {
		    runSuite('24', '4to26', done);
		});
		it("Should compare without indicators if compareWithoutIndicators options is true. Selects the field with most indicators.", function(done) {
		    runSuite('25', '4to26', done);
		});
		it("Should only make superset comparisons when identical fields are not present.", function(done) {
		    runSuite('26', '4to26', done);
		});

		it("Should move field matching regex", function(done) {
		    runSuite('27', '27to28', done);
		});
		it("Should move fields matching regex", function(done) {
		    runSuite('28', '27to28', done);
		});
		it("Should not copy field from other if preferred already has one", function(done) {
		    runSuite('29', '29to31', done);
		});
		it("Should copy field from other if preferred doesn't have one", function(done) {
		    runSuite('30', '29to31', done);
		});

		it("Should keep data from preferred if other doesn't have it", function(done) {
		    runSuite('31', '29to31', done);
		});

		it("Should select the field that has more subfields using substring comparison of field equality", function(done) {
		    getResources('32', '32to40').then(function(resources) {
			try {

			    var record_preferred = MarcRecord.fromString(resources.data.preferred);
			    var record_other = MarcRecord.fromString(resources.data.other);
			    
			    expect(function() {
				mergeFactory(resources.config)(record_preferred, record_other);
			    }).to.throw(/^selectBetter cannot be used if there are multiple fields of same tag/);

			    done();

			} catch (e ) {
			    done(e);
			}
		    }, done);
		});

		it("SelectBetter option should not create a copy of identical fields", function(done) {
		    runSuite('33', '32to40', done);
		});

		it("SelectBetter option should not create a copy of non-identical fields and it should use the one in preferred if neither is subset", function(done) {
		    runSuite('34', '32to40', done);
		});

		it("SelectBetter option should use the field from other record if it's a superset", function(done) {
		    runSuite('35', '32to40', done);
		});

		it("SelectBetter option should use the field from preferred record if it's a superset", function(done) {
		    runSuite('36', '32to40', done);
		});

		it("SelectBetter should copy the field from other if it's missing from preferred", function(done) {
		    runSuite('37', '32to40', done);
		});

		it("SelectBetter should keep the field from preferred if it's missing from other", function(done) {
		    runSuite('38', '32to40', done);
		});

		it("Should select the field that has more subfields using substring comparison of field equality", function(done) {
		    runSuite('39', '32to40', done);
		});

		it("Should select the field that has better subfields if the fields have equal sets of subfields using substring comparator", function(done) {
		    runSuite('40', '32to40', done);
		});
		it("Should select the field from other when it has more subfields", function(done) {
		    runSuite('41', '41to43', done);
		});

		it("Should select the field from preferred when it has more subfields", function(done) {
		    runSuite('42', '41to43', done);
		});

		it("Should not select the field from other when there is no field in preferred", function(done) {
		    runSuite('43', '41to43', done);
		});

		it("Should combine identical ISBN fields into a single one.", function(done) {
		    runSuite('44', '44to56', done);
		});

		it("Should compare ISBN field equality without q-subfield.", function(done) {
		    runSuite('45', '44to56', done);
		});

		it("Should merge multiple different q-subfields to the same field. ", function(done) {
		    runSuite('46', '44to56', done);
		});

		it("Should create an array of c subfields if there are multiple different ones.", function(done) {
		    runSuite('47', '44to56', done);
		});

		it("Should merge multiple similar z-subfields.", function(done) {
		    runSuite('48', '44to56', done);
		});

		it("Should keep all of the subfields", function(done) {
		    runSuite('49', '44to56', done);
		});

		it("Should not make multiple isbn fields from similar items", function(done) {
		    runSuite('50', '44to56', done);
		});

		it("Should not make multiple isbn fields from similar items", function(done) {
		    runSuite('51', '44to56', done);
		});

		it("Should merge multiple different z-subfields to the same field. ", function(done) {
		    runSuite('52', '44to56', done);
		});

		it("Should not merge multiple different z,q-subfields to the same field when a-subfield is missing.", function(done) {
		    runSuite('53', '44to56', done);
		});

		it("Should merge multiple different z-subfields to the same field. ", function(done) {
		    runSuite('54', '44to56', done);
		});

		it("Should not merge multiple fields if all of the subfields are marked as compareWithout", function(done) {
		    runSuite('55', '44to56', done);
		});
		
		it("Should create an array of c subfields if there are multiple different ones.", function(done) {
		    runSuite('56', '44to56', done);
		});

		it("Should not mess up any fields.", function(done) {
		    runSuite('57', '57to63', done);
		});
		it("SelectBetter option should not create a copy of identical fields.", function(done) {
		    runSuite('58', '57to63', done);
		});
		it("SelectBetter option should not create a copy of non-identical fields and it should use the one in preferred if neither is subset.", function(done) {
		    runSuite('59', '57to63', done);
		});
		it("SelectBetter option should use the field from other record if it's a superset", function(done) {
		    runSuite('60', '57to63', done);
		});
		it("SelectBetter option should use the field from preferred record if it's a superset", function(done) {
		    runSuite('61', '57to63', done);
		});
		it("SelectBetter should copy the field from other if it's missing from preferred.", function(done) {
		    runSuite('62', '57to63', done);
		});
		it("SelectBetter should keep the field from preferred if it's missing from other.", function(done) {
		    runSuite('63', '57to63', done);
		});

		it("Should use custom action", function(done) {
		    
		    function customAction(record_merged, field_other, options)
		    {
			
			record_merged.fields = record_merged.fields.filter(function(field) {
			    return field.tag !== '100';
			});
			
			field_other.wasUsed = true;
			field_other.fromOther = true;
			record_merged.fields.push(field_other);
			
		    }
		    
		    runSuite('64', '64', done, {
			actions: {
			    chooseField100FromOther: customAction
			}
		    });
		    
		});

		it('It should transform a copied field', function(done) {
		    runSuite('65', '65', done);
		});

		it('It should pick fields from the other field that is not copied to the merged record', function(done) {
		    runSuite('66', '66', done);
		});

		it('It should pick only missing fields from the other field that is not copied to the merged record', function(done) {
		    runSuite('67', '67', done);
		});

		it('It should pick fields from the other field to the preferred field that is considered better', function(done) {
		    runSuite('68', '68', done);
		});

		it('It should pick fields from the preferred field to the other field that is considered better', function(done) {
		    runSuite('69', '69', done);
		});

		it('It should pick only missing fields from the other field to the preferred field that is considered better', function(done) {
		    runSuite('70', '70', done);
		});

		it('Should insert new content before the similar field', function(done) {
		    runSuite('71', '71', done);
		});

		it('Should insert new content according to specified sort index', function(done) {
		    runSuite('72', '72', done);
		});

		it("Should keep the preferred field instead of selecting the better one because 'skipOnMultiple' is true", function(done) {
		    runSuite('73', '73', done);
		});

		it("Should return the merged record and details about the merge process", function() {

		    var record_merged = new MarcRecord({
			fields: [{
				tag: '003',
				value: 'CaOONL'
			}]
		    }),
		    record_preferred = new MarcRecord({
			fields: []
		    }),
		    record_other = new MarcRecord({
			fields: [{
			    tag: '003',
			    value: 'CaOONL'
			}]
		    }),
		    result = mergeFactory({
			fields: {
			    '003': {
				action: 'controlfield'
			    }
			}
		    })(record_preferred, record_other, 1);
		    
		    expect(result).to.be.an('object');
		    expect(result).to.have.all.keys(['record', 'details']);
		    expect(result.record.toString()).to.eql(record_merged.toString());
		    expect(result.details).to.eql({
			'003': [{
			    action: 'controlfield',
			    index: 0
			}]
		    });

		});

	    });

	});

    };

}
