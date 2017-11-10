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
  if (typeof define === 'function' && define.amd) {
    define([
      'chai/chai', 
      'marc-record-js', 
      '../lib/main', 
      '@natlibfi/es6-shims/lib/shims/array'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'), 
      require('marc-record-js'), 
      require('../lib/main'), 
      require('@natlibfi/es6-shims/lib/shims/array')
    );
  }

}(this, factory));

function factory(chai, MarcRecord, mergeFactory, shim_array)
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

            expect(record_merged.toString().trim()).to.equal(resources.data.merged.trim(), 'merged do not match');
            expect(record_preferred.toString().trim()).to.equal(resources.data.preferred.trim(), 'preferreds do not match');
            expect(record_other.toString().trim()).to.equal(resources.data.other.trim(), 'others do not match');

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

      it('Should return a function with empty plugins', function() {
        expect(mergeFactory({
          fields: []
        }, {
          plugins: {}
        })).to.be.a('function');
      });
      
    });
    
    describe('object', function() {
      
      it('Should apply plugins', function() {
        expect(function() {
          mergeFactory({
            fields: {
              '...': {
                action: 'foobar'
              }
            }
          }, {
            actions: {
              foobar: function(record_merged, record_other, options, comparators) {
                comparators.fooBar();
              }
            },
            comparators: {
              fooBar: function() {}
            }
          })(
            new MarcRecord({
              fields: [{
                tag: '001',
                value: 'foo'
              }]
            }),
            new MarcRecord({
              fields: [{
                tag: '001',
                value: 'bar'
              }]
						})
					);
				}).to.not.throw();
      });

    });
    
    describe('merge', function() {

      it('Should fail because of non-existing action', function() {
        expect(function() {
          mergeFactory({
            fields: {
              '...': {
                action: 'foobar'
              }
            }
          })(
            new MarcRecord({
              fields: [{
                tag: '001',
                value: 'foo'
              }]
            }),
            new MarcRecord({
              fields: [{
                tag: '001',
                value: 'bar'
              }]
            })
          );
				}).to.throw(Error, /^Undefined action \'foobar\'$/);
      });

      it("Should be copied from other record if it's not present in preferred record", function(done) {
        runSuite('1', '1to3', done);
      });

      it("Should be kept if missing from from other record", function(done) {
        runSuite('2', '1to3', done);
      });

      it("Should take it from preferred record if both records have it", function(done) {
        runSuite('3', '1to3', done);
      });

      it("Should not copy the field from other record because indicators do not match (Indicator 2)", function(done) {
        runSuite('74', '1to3', done);
      });

      it("Should not copy the field from other record because indicators do not match (Indicator 1)", function(done) {
        runSuite('75', '1to3', done);
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

      it("Should copy because copyIf matches", function(done) {
        runSuite('78', '78to79', done);
      });

      it("Should not copy because copyIf does not match", function(done) {
        runSuite('79', '78to79', done);
      });

      it("Should copy because copyUnless does not match", function(done) {
        runSuite('80', '80to81', done);
      });

      it("Should not copy because copyUnless matches", function(done) {
        runSuite('81', '80to81', done);
      });

      it("Should copy field from other record and discard from preferred", function(done) {
        runSuite('82', '82', done);
      });

      it("It should keep matched subfield", function(done) {
        runSuite('83', '83to85', done);
      });

      it("It should drop unmatched subfields", function(done) {
        runSuite('84', '83to85', done);
      });

      it("It should keep subfields from preferred", function(done) {
        runSuite('85', '83to85', done);
      });

      it("It should keep exactly matched subfield", function(done) {
        runSuite('86', '86', done); 
      });

      it("It should keep unmatched subfield", function(done) {
        runSuite('87', '87', done);
      });

      it("It should keep exactly unmatched subfield", function(done) {
        runSuite('88', '88', done);
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
      it("Should copy field from the preferred record and include b-subfield only from the preferred field because the subfield are compared as normalized", function(done) {
        runSuite('77', '77', done);
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

      it("Should create new field based on field in other record", function() {
        var record_preferred = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "020    ‡z";

        var record_other = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "020    ‡a978-952-67417-9-6";

        var record_expected = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "720 12 ‡b123‡z9789526741796";

        var config = { "fields": { "020": { "action": "createFrom", "options": { "convertTag": "720", "ind1": "1", "ind2": "2", "subfields": { "a": { "convertCode": "z", "modifications": [ { "type": "replace", "args": [/-/g, ""] } ] }, "b": { "replaceValue": "123" } } } } } };

        var record_preferred_obj = MarcRecord.fromString(record_preferred);
        var record_other_obj = MarcRecord.fromString(record_other);

        var record_merged = mergeFactory(config)(record_preferred_obj, record_other_obj);

        expect(record_merged.toString().trim()).to.equal(record_expected.trim(), 'merged do not match');
        expect(record_preferred_obj.toString().trim()).to.equal(record_preferred.trim(), 'preferreds do not match');
        expect(record_other_obj.toString().trim()).to.equal(record_other.trim(), 'others do not match');
      });

      it("Should add new subfield to existing field using field in other record", function() {
        var record_preferred = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "773    ‡7p1am";

        var record_other = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "100 1  ‡aAbcd";

        var record_expected = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "773    ‡7p1am‡aAbcd";

        var config = { "fields": { "100": { "action": "createFrom", "options": { "convertTag": "773", "useExisting": true, "subfields": { "a": {} } } } } };

        var record_preferred_obj = MarcRecord.fromString(record_preferred);
        var record_other_obj = MarcRecord.fromString(record_other);

        var record_merged = mergeFactory(config)(record_preferred_obj, record_other_obj);

        expect(record_merged.toString().trim()).to.equal(record_expected.trim(), 'merged do not match');
        expect(record_preferred_obj.toString().trim()).to.equal(record_preferred.trim(), 'preferreds do not match');
        expect(record_other_obj.toString().trim()).to.equal(record_other.trim(), 'others do not match');
      });

      it("Should add new subfield to existing field keeping field in other record", function() {
        var record_preferred = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "773    ‡7p1am";

        var record_other = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "100    ‡aAbcd";

        var record_expected = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "773    ‡7p1am" + "\n" +
          "773    ‡aAbcd";

        var config = { "fields": { "100": { "action": "createFrom", "options": { "convertTag": "773", "keepExisting": true, "subfields": { "a": {} } } } } };

        var record_preferred_obj = MarcRecord.fromString(record_preferred);
        var record_other_obj = MarcRecord.fromString(record_other);

        var record_merged = mergeFactory(config)(record_preferred_obj, record_other_obj);

        expect(record_merged.toString().trim()).to.equal(record_expected.trim(), 'merged do not match');
        expect(record_preferred_obj.toString().trim()).to.equal(record_preferred.trim(), 'preferreds do not match');
        expect(record_other_obj.toString().trim()).to.equal(record_other.trim(), 'others do not match');
      });

      it("Should add new field with subfield concatenating two subfields together", function() {
        var record_preferred = 
          "LDR    ^^^^^cam^a2200637zi^4500";

        var record_other = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "260    ‡aabc‡bdef";

        var record_expected = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "773    ‡dabcdef";

        var config = { "fields": { "260": { "action": "createFrom", "options": { "convertTag": "773", "subfields": { "a": { "convertCode": "d", "append": true }, "b": { "convertCode": "d", "append": true } } } } } };

        var record_preferred_obj = MarcRecord.fromString(record_preferred);
        var record_other_obj = MarcRecord.fromString(record_other);

        var record_merged = mergeFactory(config)(record_preferred_obj, record_other_obj);

        expect(record_merged.toString().trim()).to.equal(record_expected.trim(), 'merged do not match');
        expect(record_preferred_obj.toString().trim()).to.equal(record_preferred.trim(), 'preferreds do not match');
        expect(record_other_obj.toString().trim()).to.equal(record_other.trim(), 'others do not match');
      });


      it("Should fail to add new field with subfield concatenating two subfields together", function() {
        var record_preferred = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "773    ‡dabc‡ddef";

        var record_other = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "260    ‡aghi";

        var config = { "fields": { "260": { "action": "createFrom", "options": { "useExisting": true, "convertTag": "773", "subfields": { "a": { "convertCode": "d", "append": true } } } } } };

        expect(function() {
          mergeFactory(config)(MarcRecord.fromString(record_preferred), MarcRecord.fromString(record_other));
        }).to.throw(Error, /^append option cannot be used if there are multiple subfields of same code\.$/);
      });

      it("Should modify field based on field in other record", function() {
        var record_preferred = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "300    ‡a1 verkkoaineisto (XXX sivua)";

        var record_other = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "300    ‡a83 s.";

        var record_expected = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "300    ‡a1 Verkkoaineisto (83 sivua) a";

        var config = { "fields": { "300": { "action": "createFrom", "options": { "subfields": { "a": { "modifications": [ { "type": "replace", "args": [/ s\./, " sivua"] }, { "type": "wrap", "args": [ "(", ")" ] }, { "type": "prepend", "args": [ "1 Verkkoaineisto " ] }, { "type": "append", "args": [ " a" ] } ] } } } } } };

        var record_preferred_obj = MarcRecord.fromString(record_preferred);
        var record_other_obj = MarcRecord.fromString(record_other);

        var record_merged = mergeFactory(config)(record_preferred_obj, record_other_obj);

        expect(record_merged.toString().trim()).to.equal(record_expected.trim(), 'merged do not match');
        expect(record_preferred_obj.toString().trim()).to.equal(record_preferred.trim(), 'preferreds do not match');
        expect(record_other_obj.toString().trim()).to.equal(record_other.trim(), 'others do not match');
      });

      it("Should fail to modify field because there are multiple fields of type", function() {
        var record_preferred = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "300    ‡a1 verkkoaineisto (XXX sivua)" + "\n" +
          "300    ‡a1 verkkoaineisto (XXX sivua)";

        var record_other = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "300    ‡a83 s.";

        var config = { "fields": { "300": { "action": "createFrom", "options": { "subfields": { "a": { "modifications": [ { "type": "unknown", "args": [/ s\./, " sivua"] } ] } } } } } };

        expect(function() {
          mergeFactory(config)(MarcRecord.fromString(record_preferred), MarcRecord.fromString(record_other));
        }).to.throw(Error, /^createFrom cannot be used if there are multiple fields of same tag.$/);
      });

      it("Should fail to modify field because unknown operation", function() {
        var record_preferred = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "300    ‡a1 verkkoaineisto (XXX sivua)";

        var record_other = 
          "LDR    ^^^^^cam^a2200637zi^4500" + "\n" +
          "300    ‡a83 s.";

        var config = { "fields": { "300": { "action": "createFrom", "options": { "subfields": { "a": { "modifications": [ { "type": "unknown", "args": [/ s\./, " sivua"] } ] } } } } } };

        expect(function() {
          mergeFactory(config)(MarcRecord.fromString(record_preferred), MarcRecord.fromString(record_other));
        }).to.throw(Error, /^Undefined string operation 'unknown'$/);
      });

      it("Should fail to select a better field because number of subfields are not equal", function() {
        expect(function() {
          mergeFactory({
          fields: {
            '245': {
              action: 'selectBetter',
              options: {
                comparator: 'fooBar'
              }
            }
          }
        }, {
          comparators: {
            'fooBar': function() { return 1; }
          }
        })(
          new MarcRecord({
            fields: [{
              tag: '245',
              subfields: [{
                code: 'a',
                value: 'foo'
              }]
            }]
          }),
          new MarcRecord({
            fields: [{
              tag: '245',
              subfields: [
                {
                  code: 'a',
                  value: 'foo'
                },
                {
                  code: 'b',
                  value: 'bar'
                }
              ]
            }]
          })
          );
        }).to.throw(Error, /^Number of subfields are not equal$/);
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
      
      it('Should return details on multiple fields', function() {
        var result = mergeFactory({
          fields: {
            '...': {
              action: 'copy'
            }
          }
        })(
          new MarcRecord({
            fields: [{
              tag: '001',
              value: 'foo'
            }]
          }),
          new MarcRecord({
            fields: [
              {
                tag: '100',
                subfields: [{
                  code: 'a',
                  value: 'foo'
                }]
              },
              {
                tag: '100',
                subfields: [{
                  code: 'a',
                  value: 'bar'
                }]
              }
            ]
          }),
          1
        );

        expect(JSON.parse(JSON.stringify(result))).to.eql({
          record: {
            fields: [
              {
                tag: '001',
                value: 'foo',
                fromPreferred: true,
                wasUsed: true
              },
              {
                tag: '100',
                subfields: [{
                  code: 'a',
                  value: 'foo'
                }],
                fromOther: true,
                wasUsed: true
              },
              {
                tag: '100',
                subfields: [{
                  code: 'a',
                  value: 'bar'
                }],
                fromOther: true,
                wasUsed: true
              }
            ]
          },
          details: {
            100: [
              {
                action: 'copy'
              },
              {
                action: 'copy'
              }
            ]
          }
        });

      });
      
      describe("mergeControlfield", function() {
        var preferred, other;
        var config = {
          "fields": {
            "008": { 
              "action": "mergeControlfield",
              "options": {
                "actions": [
                  {
                    "formats": ["BK", "CF", "CR", "MU", "MX", "VM", "MP"],
                    "range": [15, 17],
                    "significantCaret": false,
                    "type": "selectNonEmpty"
                  },
                  {
                    "formats": ["BK", "CF", "CR", "MU", "MX", "VM", "MP"],
                    "range": [35, 37],
                    "significantCaret": false,
                    "type": "selectNonEmpty"
                  },
                  {
                    "formats": ["BK"],
                    "range": [18, 21],
                    "significantCaret": true,
                    "type": "combine"
                  }
                ]
              }
            }
          }
        };
        function selectValue(tag, record) {
          var field = shim_array.find(record.fields, function(field) { return field.tag === tag; });
          if (field) {
            return field.value;
          }
          return undefined;
        }
        function setType(chars, leader) {
          return leader.substr(0,6) + chars + leader.substr(8);
        }
        function prime008Fields(preferredValue, otherValue) {
          preferred.appendControlField(['008', preferredValue]);
          other.appendControlField(['008', otherValue]);
        }

        function primeTypes(preferredType, otherType) {
          
          var typeChars = {
            'BK': 'am',
            'MU': 'cm'
          };
          
          preferred.leader = setType(typeChars[preferredType], preferred.leader);
          other.leader = setType(typeChars[otherType], other.leader);

        }

        beforeEach(function() {
          preferred = new MarcRecord();
          other = new MarcRecord();

          preferred.leader = "00000cam^a2200733^i^4500";
          other.leader = "00000cam^a2200733^i^4500";
        });

        function selectMerged008Value() {
          var merged = mergeFactory(config, [])(preferred, other);
          return selectValue('008', merged);
        }

        it("should pick value form other if preferred is empty", function() {
          primeTypes('BK', 'BK');
          prime008Fields(
            '861000s1972^^^^||||||||||||||||||||eng||',
            '861000s1972^^^^xxu|||||||||||||||||eng||'
          );
          
          expect(selectMerged008Value()).to.equal('861000s1972^^^^xxu|||||||||||||||||eng||');
        });

        it("should not do anything if record types are different", function() {
          primeTypes('BK', 'MU');
          prime008Fields(
            '861000s1972^^^^||||||||||||||||||||eng||',
            '861000s1972^^^^xxu|||||||||||||||||eng||'
          );
          
          expect(selectMerged008Value()).to.equal('861000s1972^^^^||||||||||||||||||||eng||');
        });

        it("should combine fragment when action type is combine", function() {
          primeTypes('BK', 'BK');
          prime008Fields(
            '861000s1972^^^^|||abc||||||||||||||eng||',
            '861000s1972^^^^|||abe||||||||||||||eng||'
          );
          
          expect(selectMerged008Value()).to.equal('861000s1972^^^^|||abce|||||||||||||eng||');
        });

        it("should not convert uncoded fragment to empty fragment", function() {
          primeTypes('BK', 'BK');
          prime008Fields(
            '861000s1972^^^^||||||||||||||||||||eng||',
            '861000s1972^^^^||||||||||||||||||||eng||'
          );
          
          expect(selectMerged008Value()).to.equal('861000s1972^^^^||||||||||||||||||||eng||');
        });
        it("should fill combined fragment with empty characters", function() {
          primeTypes('BK', 'BK');
          prime008Fields(
            '861000s1972^^^^|||c||||||||||||||||eng||',
            '861000s1972^^^^|||ae|||||||||||||||eng||'
          );
          
          expect(selectMerged008Value()).to.equal('861000s1972^^^^|||ace^|||||||||||||eng||');
        });
      });
    });
    
  };

}
