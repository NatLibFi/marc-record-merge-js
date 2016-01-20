# MARC record merge [![NPM Version](https://img.shields.io/npm/v/marc-record-merge.svg)](https://npmjs.org/package/marc-record-merge) [![Build Status](https://travis-ci.org/NatLibFi/marc-record-merge.svg)](https://travis-ci.org/NatLibFi/marc-record-merge) [![Test Coverage](https://codeclimate.com/github/NatLibFi/marc-record-merge/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/marc-record-merge/coverage)

marc-record-merge is a configurable javascript module for merging marc records. 

## Installation

```
npm install marc-record-merge
```

## Usage

The records are expected to be marc-record-js instances.

```
var Merger = require('marc-record-merge');
var merger = new Merger(config);

merger.merge(record1, record2).then(function(mergedRecord) {
  // mergedRecord is now a record that has been merged from record1 and record2 using given configurations.
}).done();

```
Additional usage examples can be found from the test/ directory.

### Configuration

Configuration is an object which looks like this:

```javascript
{
  fields: {
    '245': {
      action: 'copy',
      options: {
        mustBeIdentical: true
      }
    }
  }
}
```

Each property of **fields** is a MARC field name or pattern (E.g. *..5*, *7.0*). The value of the property is an object which must contain a **action** property. Action-specific options are defined in **options** property.

#### Actions

**controlfield**: Copy missing control fields from the other record.

**copy**: Copy fields from other record. The following options are supported:

- _**mustBeIdentical**_: A boolean determing whether all subfields must be identical
- _**compareWithoutIndicators**_: A boolean determing whether field indicators must be identical
- _**compareWithout**_: An array of subfield codes to filter out from comparison
- _**combine**_: An array of subfields codes to combine

**selectBetter**: Selects the **"better"** one from the same field of both records. Cannot be used if the tag has multiple fields. The following options are supported:

- _**requireFieldInBoth**_: A boolean determing whether the field must exist in both records to make changes.
- _**onlyIfMissing**_: A boolean determing whether the field will be selected from the other record only if it missing from preferred record.
- _**comparator**_: A subfield comparator function or a name of a predefined function. Following predefined functions names are available: **substring** (Subfield value must be found in the corresponding subfield value in the other record). Comparator defaults to requiring subfield codes and values to both identical.

The action can also be a function.

## Contributions

The grunt default task will run jshint, tests and coverage for the module. Tests can be found from test/ directory.

To test that everything is ok, just run:
```
grunt
```

The ci will do the same when commits are pushed to this repository.

## License and copyright

Copyright (c) 2015-2016 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **GNU Affero General Public License Version 3**.
