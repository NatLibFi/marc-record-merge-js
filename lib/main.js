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

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';
  
  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/object',
      'es6-shims/lib/shims/array',
      'marc-record-js'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('es6-shims/lib/shims/array'),
      require('marc-record-js')
    );
  } else {
    root.mergeMarcRecordsFactory = factory(
      root.Object,
      root.es6_array_shim,
      root.MarcRecord
    );
  }

}(this, factory));

function factory(Object, shim_array, MarcRecord)
{

  "use strict";

  var DEFAULT_OPTIONS = {
    sort: {
      insert: 'after'
    }
  },
      DIACRITICS_REMOVAL_MAP = [  
        {'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
        {'base':'AA','letters':'\uA732'},
        {'base':'AE','letters':'\u00C6\u01FC\u01E2'},
        {'base':'AO','letters':'\uA734'},
        {'base':'AU','letters':'\uA736'},
        {'base':'AV','letters':'\uA738\uA73A'},
        {'base':'AY','letters':'\uA73C'},
        {'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
        {'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
        {'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779'},
        {'base':'DZ','letters':'\u01F1\u01C4'},
        {'base':'Dz','letters':'\u01F2\u01C5'},
        {'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
        {'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
        {'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
        {'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
        {'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
        {'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
        {'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
        {'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
        {'base':'LJ','letters':'\u01C7'},
        {'base':'Lj','letters':'\u01C8'},
        {'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
        {'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
        {'base':'NJ','letters':'\u01CA'},
        {'base':'Nj','letters':'\u01CB'},
        {'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
        {'base':'OI','letters':'\u01A2'},
        {'base':'OO','letters':'\uA74E'},
        {'base':'OU','letters':'\u0222'},
        {'base':'OE','letters':'\u008C\u0152'},
        {'base':'oe','letters':'\u009C\u0153'},
        {'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
        {'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
        {'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
        {'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
        {'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
        {'base':'TZ','letters':'\uA728'},
        {'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
        {'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
        {'base':'VY','letters':'\uA760'},
        {'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
        {'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
        {'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
        {'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
        {'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
        {'base':'aa','letters':'\uA733'},
        {'base':'ae','letters':'\u00E6\u01FD\u01E3'},
        {'base':'ao','letters':'\uA735'},
        {'base':'au','letters':'\uA737'},
        {'base':'av','letters':'\uA739\uA73B'},
        {'base':'ay','letters':'\uA73D'},
        {'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
        {'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
        {'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
        {'base':'dz','letters':'\u01F3\u01C6'},
        {'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
        {'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
        {'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
        {'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
        {'base':'hv','letters':'\u0195'},
        {'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
        {'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
        {'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
        {'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
        {'base':'lj','letters':'\u01C9'},
        {'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
        {'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
        {'base':'nj','letters':'\u01CC'},
        {'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
        {'base':'oi','letters':'\u01A3'},
        {'base':'ou','letters':'\u0223'},
        {'base':'oo','letters':'\uA74F'},
        {'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
        {'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
        {'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
        {'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
        {'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
        {'base':'tz','letters':'\uA729'},
        {'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
        {'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
        {'base':'vy','letters':'\uA761'},
        {'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
        {'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
        {'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
        {'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
      ];

  var diacritics_removal_map = DIACRITICS_REMOVAL_MAP.reduce(function(result, element) {
    
    element.letters.split('').forEach(function(letter) {
      result[letter] = element.base;
    });

    return result;

  }, {});
  
  return function(configuration, plugins)
  {

    var actions = {
      controlfield: actionControlfield,
      copy: actionCopy,
      selectBetter: actionSelectBetter
    },
    comparators = {
      substring: subfieldSubstringComparator,
      equality: subfieldEquality
    };
    
    function applyPlugins(obj, name)
    {
      if (typeof plugins === 'object') {

        if (typeof plugins.actions === 'object') {
          Object.keys(plugins.actions).filter(function(key) {
            return typeof plugins.actions[key] === 'function';
          }).forEach(function(key) {
            actions[key] = plugins.actions[key];
          });
        }
        
        if (typeof plugins.comparators === 'object') {
          Object.keys(plugins.comparators).filter(function(key) {
            return typeof plugins.comparators[key] === 'function';
          }).forEach(function(key) {
            comparators[key] = plugins.comparators[key];
          });
        }
        
      }
    }

    function subfieldSubstringComparator(subfield1, subfield2) {
      return subfield1.code == subfield2.code && (subfield1.value.indexOf(subfield2.value) >= 0 || subfield2.value.indexOf(subfield1.value) >= 0);
    }
    
    function subfieldEquality(subfield1, subfield2) {
      return subfield1.code == subfield2.code && subfield1.value == subfield2.value;
    }

    function arrayDifference(a1, a2, equalityFunction)
    {

      equalityFunction = typeof equalityFunction === 'function' ? equalityFunction : function(a, b) {
        return a === b;
      };

      return a1.filter(function(element) {
        return shim_array.find(a2, function(element2) {
          return equalityFunction(element, element2);
        }) === undefined;
      });

    }

    function arraysIdentical(a1, a2, equalityFunction)
    {
      return arrayDifference(a1, a2, equalityFunction).length === 0 && arrayDifference(a2, a1, equalityFunction).length === 0;
    }

    function clone(obj)
    {
      return JSON.parse(JSON.stringify(obj));
    }
    
    function getCompareWithoutSubfields(field, options) {

      var subfields = [];

      if (options.compareWithout) {

        subfields = field.subfields.filter(function(subfield) {
          return options.compareWithout.indexOf(subfield.code) !== -1;
        });

      }

      return subfields;
    }

    /**
     * Try to make a list of equal pairs from both subfield arrays using a comparator function
     **/
    function makeSubfieldPairs(subfields1, subfields2, fn_comparator) {
      
      var pairs = [];

      if (subfields1.length === subfields2.length) {

        subfields2.forEach(function(subfield2) {          
          return subfields1.some(function(subfield1) {
            if (fn_comparator(subfield1, subfield2)) {
              
              pairs.push([subfield1, subfield2]);
              return true;
              
            }
          });
        });

      } else {
        throw new Error('Number of subfields are not equal');
      }

      return pairs;
      
    }

    function combineSubfields(code, field) {

      var subfields, value_combined,
          first_subfield_index = shim_array.findIndex(field.subfields, function(subfield) {
            return subfield.code === code;
          });

      if (first_subfield_index >= 0) {
        
        subfields = field.subfields.filter(function(subfield) {
          return subfield.code === code;
        });

        if (subfields.length > 1) {

          value_combined = subfields.reduce(function(result, subfield) {
            return result.length > 0 ? result + ', ' + subfield.value : result + subfield.value;
          }, '');
          
          /**
           * @internal Remove subfields with the code that is to be combined
           */
          field.subfields = field.subfields.filter(function(subfield) {
            return subfield.code !== code;
          });
          
          field.subfields.splice(first_subfield_index, 0, {
            code: code,
            value: '[' + value_combined + ']'
          });

        }

      }

    }

    function normalizeField(field) {

      var normalized = clone(field);

      normalized.subfields.forEach(function(subfield) {
        subfield.value = normalizeString(subfield.value);
      });

      return normalized;

    }

    function fieldsSimilar(field1, field2, options) {
      
      var field1_normalized = normalizeField(field1);
      var field2_normalized = normalizeField(field2);

      if (options.compareWithout !== undefined) {

        options.compareWithout.forEach(function(code_filter) {

          [field1_normalized, field2_normalized].forEach(function(field) {
            field.subfields = arrayDifference(field.subfields, field.subfields.filter(function(subfield) {
              return subfield.code == code_filter;
            }));
          });

        });

      }

      if (options.compareWithoutIndicators !== true) {
        
        if (field1_normalized.ind1 !== field2_normalized.ind1) {
          return false;
        }

        if (field1_normalized.ind2 !== field2_normalized.ind2) {
          return false;
        }

      }

      /**
       * @internal If fields have 0 subfields (f.ex. because of comparewithout), then fields are not deemed identical.
       **/
      if (field1_normalized.subfields.length === 0 ||
          field2_normalized.subfields.length === 0) {
        return false;
      }

      if (options.mustBeIdentical === true) {
        
        if (!arraysIdentical(field1_normalized.subfields, field2_normalized.subfields, subfieldEquality)) {
          return false;
        }
      }

      /**
       * @internal Neither is subset
       **/
      if (arrayDifference(field1_normalized.subfields, field2_normalized.subfields, subfieldEquality).length !== 0 &&
          arrayDifference(field2_normalized.subfields, field1_normalized.subfields, subfieldEquality).length !== 0) {

        return false;

      }
      
      return true;

    }

    function normalizeString(str)
    {
      
      function removeCase(str)
      {
        return str.toLowerCase();
      }
      
      function removePunctuation(str) 
      {
        return str.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g," ")
          .replace(/\s{2,}/g, " ")
          .trim();
      }

      function removeDiacritics(str)
      {
        return str.split('').reduce(function(result, letter) {
          return diacritics_removal_map.hasOwnProperty(letter) ? result + diacritics_removal_map[letter] : result + letter;
        }, '');
      }
      
      return removePunctuation(removeCase(removeDiacritics(str)));

    }

    function pickSubfields(field_to, field_from, subfield_codes, missing_only)
    {    
      field_from.subfields
        .filter(function(subfield) {
          return subfield_codes.indexOf(subfield.code) >= 0;
        })
        .forEach(function(subfield) {

          if (missing_only === true) {
            if (!field_to.subfields.some(function(subfield_to) {
              return subfield_to.code === subfield.code;
            })) {
              field_to.subfields.push(clone(subfield));
            }
          } else {
            field_to.subfields.push(clone(subfield));
          }

        });
    }

    function insertField(record, field)
    {

      function getSortIndex(tag)
      {
        
        var index;

        if (configuration.sort.indexes) {

          Object.keys(configuration.sort.indexes).some(function(pattern_index) {
            if (new RegExp('^' + pattern_index + '$').test(tag)) {

              index = configuration.sort.indexes[pattern_index];
              return 1;

            }
          });

        }
        
        return index === undefined ? parseInt(tag, 10) : index;
        
      }
      
      function beforeCallback(field_record, index)
      {
        if (field.tag == field_record.tag) {
          index_insert = index;
          return 1;
        }
      }

      function afterCallback(field_record, index)
      {
        if (field.tag == field_record.tag) {
          index_insert = index;
        } else if (index_insert !== undefined) {
          index_insert = index;
          return 1;
        }
      }

      var index_insert, index_sort;

      if (!record.fields.some(configuration.sort.insert === 'before' ? beforeCallback : afterCallback) && index_insert !== undefined && configuration.sort.insert === 'after') {
        index_insert++;
      }

      if (index_insert === undefined) {

        index_sort = getSortIndex(field.tag);

        record.fields.some(function(field_record, index) {

          if ((index_sort - getSortIndex(field_record.tag)) < 0) {
            index_insert = index;
            return 1;
          }
          
        });

      }

      record.fields.splice(index_insert === undefined ? record.fields.length : index_insert, 0, field);

    }

    function actionControlfield(record_merged, field_other, options, comparators, return_details) {

      if (!record_merged.fields.some(function(field_merged) {
        return field_merged.tag == field_other.tag;
      })) {
        
        field_other.wasUsed = true;
        field_other.fromOther = true;
        record_merged.fields.push(clone(field_other));

        return !return_details ? undefined : {
          index: record_merged.fields.length - 1
        };

      }
      
    }

    function actionCopy(record_merged, field_other, options, comparators, return_details) {
      
      var subfields_compare_without, removed_subfields_preferred, removed_subfields_other, fields_preferred, field_preferred, field_preferred_normalized, field_other_normalized, field_other_copy, field_transformed,
          details = return_details ? {} : undefined;

      options = typeof options === 'object' ? options : {};

      fields_preferred = record_merged.fields.filter(function(field) {
        return field.tag == field_other.tag;
      });

      field_preferred = shim_array.find(fields_preferred, function(field) {

        return fieldsSimilar(field, field_other, Object.assign(clone(options), {
          mustBeIdentical: true
        }));
        
      });

      if (field_preferred === undefined) {
        field_preferred = shim_array.find(fields_preferred, function(field) {
          return fieldsSimilar(field, field_other, options);
        });
      }
      
      if (field_preferred === undefined) {

        if (fields_preferred.length > 0 && typeof options.transformOnInequality === 'object') {

          field_transformed = clone(field_other);
          field_transformed.tag = options.transformOnInequality.tag;

          if (options.transformOnInequality.drop) {
            field_transformed.subfields = field_transformed.subfields.filter(function(subfield) {
              return options.transformOnInequality.drop.indexOf(subfield.code) < 0;
            });
          }

          if (options.transformOnInequality.map) {

            field_transformed.subfields = field_transformed.subfields.map(function(subfield) {
              
              Object.keys(options.transformOnInequality.map).some(function(key) {
                if (options.transformOnInequality.map[key] === subfield.code) {
                  subfield.code = key;
                  return true;
                }
              });

              return subfield;

            });

          }

          if (options.transformOnInequality.add) {
            Object.keys(options.transformOnInequality.add).forEach(function(key) {
              field_transformed.subfields.push({
                code: key,
                value: options.transformOnInequality.add[key]
              });
            });
          }

          insertField(record_merged, field_transformed);

        } else {

          field_other.wasUsed = true;
          field_other.fromOther = true;
          insertField(record_merged, clone(field_other));

        }

      } else { 
                  
        removed_subfields_preferred = getCompareWithoutSubfields(field_preferred, options);
        removed_subfields_other = getCompareWithoutSubfields(field_other, options);

        field_preferred.subfields = arrayDifference(field_preferred.subfields, removed_subfields_preferred);
        field_other.subfields = arrayDifference(field_other.subfields, removed_subfields_other);

        subfields_compare_without = removed_subfields_preferred.concat(removed_subfields_other).reduce(function(result, subfield) {
          
          return result.some(function(element) {
            return subfieldEquality(element, subfield);
          }) ? result : result.concat(subfield);

        }, []);

        /**
         * @internal Determine which record's field to use, the preferred or the other one
         */
        field_preferred_normalized = normalizeField(field_preferred);
        field_other_normalized = normalizeField(field_other);

        /**
         * @internal Preferred record's subfields are a "proper" subset of other record's fields.
         **/
        if (arrayDifference(field_preferred_normalized.subfields, field_other_normalized.subfields, subfieldEquality).length === 0 && 
            arrayDifference(field_other_normalized.subfields, field_preferred_normalized.subfields, subfieldEquality).length > 0) {
          
          field_other_copy = clone(field_other);

          if (options.compareWithoutIndicators === true) {
            field_other_copy.ind1 = field_other_copy.ind1 === ' ' ? field_preferred.ind1 : field_other_copy.ind1;
            field_other_copy.ind2 = field_other_copy.ind2 === ' ' ? field_preferred.ind2 : field_other_copy.ind2;
          }

          /**
           * @internal The field that will be copied will contain subfields that are not using in comparison from both records
           */
          field_other_copy.subfields = field_other_copy.subfields.concat(subfields_compare_without);

          field_other.wasUsed = true;
          field_other_copy.fromOther = true;

          /**
           * @internal Combine any subfields 
           **/
          if (options.combine) {
            options.combine.forEach(function(code) {
              combineSubfields(code, field_other_copy);
            });
          }

          if (options.pick) {
            pickSubfields(field_other_copy, field_preferred, options.pick.subfields, options.pick.missingOnly);
          }

          record_merged.fields.splice(record_merged.fields.indexOf(field_preferred), 1, field_other_copy);
          
          /**
           * @internal Add back the subfields that are not used in comparisons
           **/
        } else {
          
          /**
           * @internal Note: field_preferred is actually the the field in merged record (which is a copy of preferred)
           **/
          field_preferred.subfields = field_preferred.subfields.concat(subfields_compare_without);

          if (options.compareWithoutIndicators === true) {
            field_preferred.ind1 = field_preferred.ind1 === ' ' ? field_other.ind1 : field_preferred.ind1;
            field_preferred.ind2 = field_preferred.ind2 === ' ' ? field_other.ind2 : field_preferred.ind2;
          }

          /**
           * @internal Combine any subfields 
           **/
          if (options.combine) {
            options.combine.forEach(function(code) {
              combineSubfields(code, field_preferred);
            });
          }

          if (options.pick) {
            pickSubfields(field_preferred, field_other, options.pick.subfields, options.pick.missingOnly);
          }
          
        }

        /**
         * @internal Add back the subfields that were not used in comparisons
         **/
        field_other.subfields = field_other.subfields.concat(removed_subfields_other);
        
      }

      return details;

    }

    function actionSelectBetter(record_merged, field_other, options, comparators, return_details) {

      
      var error_invalid_record, field_merged, field_merged_normalized, field_other_normalized, field_other_copy, subfield_pairs_sizes, subfield_pairs_scores, fn_comparator, index_better, subfields_picked,
          details = return_details ? {} : undefined,
          fields_merged = record_merged.fields.filter(function(field) {
            return field.tag == field_other.tag;
          });

      options = typeof options === 'object' ? options : {};
      fn_comparator = comparators.hasOwnProperty(options.comparator) ? comparators[options.comparator] : comparators.equality;

      if (fields_merged.length > 1 && !options.skipOnMultiple) {
        
        error_invalid_record = new Error('selectBetter cannot be used if there are multiple fields of same tag.');
        error_invalid_record.name = 'InvalidRecordError';

        throw error_invalid_record;

      } else if (fields_merged.length === 0) {
        
        if (!options.requireFieldInBoth) {
          
          field_other.wasUsed = true;
          field_other.fromOther = true;
          insertField(record_merged, clone(field_other));

        }

      } else if (!options.onlyIfMissing) {

        field_merged = fields_merged[0];
        field_merged_normalized = normalizeField(field_merged);
        field_other_normalized =  normalizeField(field_other);

        if (arraysIdentical(field_merged_normalized.subfields, field_other_normalized.subfields, fn_comparator)) {

          subfield_pairs_sizes = makeSubfieldPairs(field_merged_normalized.subfields, field_other_normalized.subfields, fn_comparator).map(function(pair) {
            
            var len1 = pair[0].value.length;
            var len2 = pair[1].value.length;

            return [len1 > len2, len2 > len1];

          });
          subfield_pairs_scores = subfield_pairs_sizes.reduce(function(result, size) { 

            return [
              size[0] === true ? result[0] + 1 : result[0],
              size[1] === true ? result[1] + 1 : result[1]
            ];

          }, [0, 0]);

          /**
           * @internal Field in other record is considered better
           **/
          if (subfield_pairs_scores[0] < subfield_pairs_scores[1]) {

            field_other_copy = clone(field_other);
            field_other.wasUsed = true;
            field_other_copy.fromOther = true;

            record_merged.fields.splice(record_merged.fields.indexOf(field_merged), 1, field_other_copy);

            if (options.pickMissing) {
              pickMissingSubfields(field_other_copy, fields_merged[0], options.pickMissing);
              subfields_picked = 1;
            }   

          }

        }

        if (arrayDifference(field_merged_normalized.subfields, field_other_normalized.subfields, fn_comparator).length === 0 && arrayDifference(field_other_normalized.subfields, field_merged_normalized.subfields, fn_comparator).length > 0) {

          /**
           * @internal Use field from other record
           **/
          field_other_copy = clone(field_other);
          field_other.wasUsed = true;
          field_other_copy.fromOther = true;

          record_merged.fields.splice(record_merged.fields.indexOf(field_merged), 1, field_other_copy);

          if (options.pick) {
            pickSubfields(field_other_copy, fields_merged[0], options.pick.subfields, options.pick.missingOnly);
            subfields_picked = 1;
          }

        }

      }

      if (subfields_picked === undefined && options.pick) {
        pickSubfields(fields_merged[0], field_other, options.pick.subfields, options.pick.missingOnly);
      }

      return details;

    }

    configuration = Object.assign(JSON.parse(JSON.stringify(DEFAULT_OPTIONS)), typeof configuration === 'object' ? configuration : {});

    applyPlugins();

    return function(record_preferred, record_other, return_details)
    {

      var details = return_details ? {} : undefined,
          record_merged = new MarcRecord(record_preferred);
      
      record_merged.fields.forEach(function(field) {
        field.wasUsed = true;
        field.fromPreferred = true;
      });
      
      record_other.fields.forEach(function(field) {

        var result,
            config = configuration.fields[shim_array.find(Object.keys(configuration.fields), function(key) {
              return new RegExp('^' + key +'$').test(field.tag);
            })];
        
        if (config !== undefined) {
          if (actions.hasOwnProperty(config.action)) {

            result = actions[config.action](record_merged, field, config.options, comparators, return_details);

            if (return_details && typeof result === 'object') {

              if (!details.hasOwnProperty(field.tag)) {
                details[field.tag] = [];
              }

              details[field.tag].push(Object.assign({
                action: config.action   
              }, result));

            }

          } else {
            throw new Error("Undefined action '" + config.action + "'");
          }
        }
        
      });

      return !return_details ? record_merged : {
        record: record_merged,
        details: details
      };

    };
    
  };

}
