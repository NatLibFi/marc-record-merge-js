# marc-record-merge

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

## Contributions

The grunt default task will run jshint, tests and coverage for the module. Tests can be found from test/ directory.

To test that everything is ok, just run:
```
grunt
```

The ci will do the same when commits are pushed to this repository.
