# MARC record merge [![NPM Version](https://img.shields.io/npm/v/marc-record-merge.svg)](https://npmjs.org/package/marc-record-merge) [![Build Status](https://travis-ci.org/NatLibFi/marc-record-merge.svg)](https://travis-ci.org/NatLibFi/marc-record-merge) [![Test Coverage](https://codeclimate.com/github/NatLibFi/marc-record-merge/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/marc-record-merge/coverage)

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
    "7..": {
      "action": "copy",
      "options": {
        "compareWithoutIndicators": true
      }
    }
  }
}

```

Each property of **fields** is a MARC field name or pattern (*..5*, *700*). The value of the **field** property is an object which must contain a **action** property. Action-specific options are defined in **options** property.

The specified action is executed for each field in the other record that matches the field tag pattern.

### Predefined actions

**controlfield**: Copy missing control fields from the other record.

**copy**: Copy fields from other record. The following options are supported:

- _**mustBeIdentical**_: A boolean determing whether all subfields must be identical
- _**compareWithoutIndicators**_: A boolean determing whether field indicators must be identical
- _**compareWithout**_: An array of subfield codes. These subfields are filtered out from the comparison
- _**combine**_: An array of subfields codes. These subfields will be combined into a single subfield
- _**pickMissing**_: An array of subfields codes which are used to pick the respective subfields from the field that is not included in the merged record. If the included field already has subfields with these codes the option has no effect
- _**transformOnInequality**_: An object describing how to transform an inequal field. For this option to take effect the preferred record must have at least one field with the same tag name as the other record. The following properties are supported:
  - _**tag**_: Tag name of the new field (*Mandatory*)
  - _**drop**_: An array of subfields codes. These subfields are not included in the new field.
  - _**add**_: An object with subfield codes as keys and subfield values as values.
  - _**map**_: An object with new subfield codes as keys and the old subfield codes as values.

**selectBetter**: Selects the **"better"** of the two fields of each record. Cannot be used if the tag has multiple fields. The following options are supported:

- _**requireFieldInBoth**_: A boolean determing whether the field must exist in both records to make changes
- _**onlyIfMissing**_: A boolean determing whether the field will be selected from the other record only if it missing from preferred record
- _**pickMissing**_: An array of subfields codes which are used to pick the respective subfields from the field that is not included in the merged record. If the included field already has subfields with these codes the option has no effect
- _**comparator**_: A subfield comparator function name

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

## License and copyright

Copyright (c) 2015-2016 **University Of Helsinki (The National Library Of Finland)**


This project's source code is licensed under the terms of **GNU Affero General Public License Version 3**.
