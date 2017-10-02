# MARC record merge [![NPM Version](https://img.shields.io/npm/v/@natlibfi/marc-record-merge.svg)](https://npmjs.org/package/marc-record-merge) [![Build Status](https://travis-ci.org/NatLibFi/marc-record-merge.svg)](https://travis-ci.org/NatLibFi/marc-record-merge) [![Test Coverage](https://codeclimate.com/github/NatLibFi/marc-record-merge/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/marc-record-merge/coverage)

A configurable Javascript module for merging [MARC](https://en.wikipedia.org/wiki/MARC_standards) records.

## Installation

Clone the sources and install the package (In the source directory) on command line using `npm`:

```sh
npm install
```

## Testing

Run the following NPM script to lint, test and check coverage of the code:

```javascript

npm run check

```

## Usage

The module returns a factory function that takes configuration object as the first (mandatory) argument. The second argument (optional) is an object specifying plugin functions. The factory returns a function that takes two MARC records (Instances of [marc-record-js](https://github.com/petuomin/marc-record-js)) as arguments. The first one is the preferred record which will be used as a base records (All fields are taken from this record unless otherwise specified).

### Node.js
```js
var mergeRecords = require('marc-record-merge')(config),
record_merged = mergeRecords(record_preferred, record_other);
```

### AMD
```js
define(['marc-record-merge'], function(mergeFactory) {

  var mergeRecords = mergeFactory(config),
  record_merged = mergeRecords(record_preferred, record_other);

});
```

### Browser globals
```js
var mergeRecords = mergeMarcRecordsFactory(config),
record_merged = mergeRecords(record_preferred, record_other);
```

## Configuration

The configuration object is a document conforming to the [schema](https://github.com/natlibfi/marc-record-merge/blob/master/resources/configuration-schema.json). The document looks like this:

```js
{
  "fields": {
    "005": {
      "action": "controlfield"
    },
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
    },
    "7..": {
      "action": "copy",
      "options": {
        "compareWithoutIndicators": true
      }
    },
   
       
  }
}

```

Each property of **fields** is a MARC field name or pattern (*..5*, *700*). The value of the **field** property is an object which must contain a **action** property. Action-specific options are defined in **options** property.

The specified action is executed for each field in the other record that matches the field tag pattern.

### Predefined actions

**controlfield**: Copy missing control fields from the other record.

**mergeControlfield**: Merge controlfields. The rules are set using options:
- _**formats**_: Array of formats to apply the rule. Available formats: `["BK", "CF", "CR", "MU", "MX", "VM", "MP"]`
- _**range**_: character range of the controlfield fragment
- _**significantCaret**_: whether the ^ is significant or not.
- _**type**_: either `combine` or `selectNonEmpty`. `selectNonEmtpy` selects value from preferred, or if it's missing the from other. `combine` merges and sorts values from both fragments.

**copy**: Copy fields from other record. The following options are supported:

- _**mustBeIdentical**_: A boolean determing whether all subfields must be identical
- _**compareWithoutIndicators**_: A boolean determing whether field indicators must be identical
- _**compareWithout**_: An array of subfield codes. These subfields are filtered out from the comparison
- _**compareSubfieldsNormalized**_: A boolean determing whether the subfields included in _compareWithout_ should be compared as normalized
- _**combine**_: An array of subfields codes. These subfields will be combined into a single subfield
- _**pick**_: Include subfields from the field that is not preserved.
  - _**subfields**_: An array of subfield codes (*Mandatory*)
  - _**missingOnly**_: A boolean determing whether only subfields missing from the target field should be picked
- _**transformOnInequality**_: An object describing how to transform an inequal field. For this option to take effect the preferred record must have at least one field with the same tag name as the other record. The following properties are supported:
  - _**tag**_: Tag name of the new field (*Mandatory*)
  - _**drop**_: An array of subfields codes. These subfields are not included in the new field.
  - _**add**_: An object with subfield codes as keys and subfield values as values.
  - _**map**_: An object with new subfield codes as keys and the old subfield codes as values.

The action copies only fields that have no match in the preferred record:

1. Attempt to find a corresponding field from preferred record
  1. Attempt to find an identical field (All options are applied to comparison)
    - [Normalize fields](#field-normalization)
    - Tag names must be identical
    - Indicators must be identical
    - Values must be identical
      1. Variable fields: Each subfield must have a matching subfield in the opposite record (Code and value identical).
      1. Control fields: The values must be identical
  1. Attempt to find a similar field if an identical field was not found (All options are applied to comparison)
    - [Normalize fields](#field-normalization)
    - Tag names must be identical
    - Indicators must be identical
    - Values comparison
      1. Variable fields: Either field's subfields must be a subset of the opposite subfields (There is a match for all of the opposite field's subfields)
      1. Control fields: The values must be identical
1. Copy or do nothing
  1. No corresponding field was found
    1. If no fields in the preferred record with the same tag name were found, copy the field
    1. If fields with the same tag were found and option *transformOnInequality* is enabled, copy the other field using the specified transformations. Otherwise do nothing.

  1. Corresponding field was found. Check if the other field is deemed different and should be copied to the merged record (All options are applied to comparison)
    1. [Normalize fields](#field-normalization)
    1. Check if the other field is a "proper" subset of the preferred field (Preferred field contains all of the other field's subfields and more)
      1. If it is, copy the field
      1. If it's not, keep the preferred field
      1. In both cases, merge the subfields that were not included in comparison by removing identical subfields

**selectBetter**: Selects the **"better"** of the two fields of each record. Cannot be used if the tag has multiple fields. The following options are supported:

- _**requireFieldInBoth**_: A boolean determing whether the field must exist in both records to make changes
- _**onlyIfMissing**_: A boolean determing whether the field will be selected from the other record only if it missing from preferred record
- _**skipOnMultiple**_: A boolean determing whether to skip the action (And keep the preferred fields) if the are multiple fields of the same tag. Default behavior is to fail the processing
- _**pick**_: Include subfields from the field that is not preserved.
  - _**subfields**_: An array of subfield codes (*Mandatory*)
  - _**missingOnly**_: A boolean determing whether only subfields missing from the target field should be picked
- _**comparator**_: A subfield comparator function name

The better field is selected as follows:

1. [Normalize fields](#field-normalization)
1. Check if both fields' subfields are considered equal (Using the comparator function)
  1. If equal, select the field that gets the most points (Fields get points for each subfield that has more characters than the corresponding subfield in the opposite field)
  1. If not equal, check if the other field is a "proper" subset of the preferred field (Preferred field contains all of the other field's subfields and more)
    1. If the other field is a subset of the preferred field, select the other field
    1. Otherwise select the preferred field 

## Field normalization

Field values (Variable field subfields or control field value) are normalized as follows:

1. String is converted to lower case
1. Punctuation (See the function _**removePunctuation**_ in [lib/main.js](https://github.com/NatLibFi/marc-record-merge/blob/master/lib/main.js) for the characters replaced) is replaced with whitespace. The resulting string is trimmed (Whitespace removed from both ends) and subsequent whitespace is reduced to single whitespace.
1. Diacritics are replaced with their corresponding ASCII characters (See the variable __*DIACRITICS_REMOVAL_MAP*__ in [lib/main.js](https://github.com/NatLibFi/marc-record-merge/blob/master/lib/main.js) for mapping)

## Predefined comparators

- **substring**: Require both subfields to have equal codes and that at least one value is a substring of the other subfield's value
- **equality**: Require both subfields to have stricly equal codes and values

### Plugins

The second argument to the factory function is a optional object specifying plugin functions. The object can have one or both of the following properties:

#### actions

An object with action names as keys and functions as values. The action is a function which alters the merged record. It has the following signature:

```js
function (record_merge, field_other, options, return_details) {}
```
**Parameters:**
- *record_merge*: The merged record which is to be modified (Based on the preferred record)
- *field_other*: The field from the other record which is the subject of the action
- *options*: Action specific options
- *return_details*: If this is defined, return action specific details about processing

The function's return value is not used unless *return_detail* is defined.

#### comparators

An object with comparator names as keys and functions as values. The comparator is a function which returns a boolean denoting whether two subfields are deemed equal. It has the following signature:

```js
function (subfield1, subfield2) {}
```

### Sorting

By default, new fields are added after the similar fields. This can be changed with the **sort** property:

```js
{
  "fields": {
    "020": {
      "action": "copy"
    }
  },
  "sort": {
    "insert": "before",
    "indexes": {
      "CAT": 995
    }
  }
}
```

### Properties
- **insert**: Defines whether new fields are inserted before or after similar fields. Defaults to *after*.
- **indexes**: An object with field tag patterns as keys and static sort indexes as values. By default, new fields are inserted by the tag's numeric index (If similar fields don't exist)

## License and copyright

Copyright (c) 2015-2017 **University Of Helsinki (The National Library Of Finland)**


This project's source code is licensed under the terms of **GNU Affero General Public License Version 3**.
