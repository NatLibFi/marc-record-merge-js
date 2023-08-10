# Merge MARC records [![NPM Version](https://img.shields.io/npm/v/@natlibfi/marc-record-merge.svg)](https://npmjs.org/package/@natlibfi/marc-record-merge)

Merge MARC records

## Usage
### COPY

Chosing fields for reducer:
```
const copyReducerConfigs = [
    {tagPattern: /010/u},
    {tagPattern: /010|020/u},
    {tagPattern: new RegExp('010', 'u')},
    {tagPattern: new RegExp(String((/^(?<tags1>010|020$)/u').source))},
  ]
```

### compareTagsOnly (Defaults false)
```
{tagPattern: /010/u, compareTagsOnly: false}
```

If base has field with that tag source field is ignored

### doNotCopyIfFieldPresent (Defaults false)
```
{tagPattern: /010/u, doNotCopyIfFieldPresent: "^011$"}
```

If base has field with that tag 011 source field is ignored

### compareWithoutIndicators (Defaults false)
```
{tagPattern: /010/u, compareWithoutIndicators: false}
```

When base and source fields are compared, indicator differences are ignored

### compareWithoutTag (Defaults false)
```
{tagPattern: /^(100|700)$/u, compareWithoutTag: false}
{tagPattern: /^(100|700)$/u, compareWithoutTag: false, swapTag: [{"from": "^100$", "to": "700"}]}
```

When base and source fields are compared, tag differences are ignored

### subfieldsMustBeIdentical (Defaults true)
```
{tagPattern: /010/u, subfieldsMustBeIdentical: true}
```

If source subfields are subset of base subfields this option says if it is copied
| subfieldsMustBeIdentical | base          | source        | copy  |
|--------------------------|---------------|---------------|-------|
| true or false            | $a foo        | $a foo        | false |
| true or false            | $a foo        | $b bar        | true  |
| true                     | $a foo        | $a foo,$b bar | true  |
| false                    | $a foo        | $a foo,$b bar | true  |
| true                     | $a foo,$b bar | $a foo        | true  |
| false                    | $a foo,$b bar | $a foo        | false |

### excludeSubfields (Defaults [ ])
```
{tagPattern: /010/u, excludeSubfields: ['a']}
```

When base and source fields are compared, excluded subfields are ignored

### swapTag (Defaults [ ])
```
{tagPattern: /^100$/u, swapTag: [{"from": "^100$", "to": "700"}]}
{tagPattern: /^(100|700)$/u, compareWithoutTag: false, swapTag: [{"from": "^100$", "to": "700"}]}
```

When fields are copied, tags are swapped. From is Regexp filter and to is string value.

### swapSubfieldCode (Defaults [ ])
```
{tagPattern: /010/u, swapSubfieldCode: [{"from": "a", "to": "b"}]}
```

When source fields are copied, subfields are checkked and if subfield.code match to 'from' value is that code swapped to 'to' value

### dropSubfields (Defaults [ ])
```
{tagPattern: /010/u, dropSubfields: [{"code": "9"}]}
```
Drops subfields 9's from all fields tagged 010

```
{tagPattern: /010/u, dropSubfields: [{"code": "9", "value": "FENNI<KEEP>"}]}
```
Drops subfields 9's that have "FENNI<KEEP>" from all fields tagged 010


```
{tagPattern: /010/u, dropSubfields: [{"code": "9", "condition": "unless", "value": "^FENNI<(?<option>KEEP|DROP)>$"}]}
```
Drops all subfield 9's unless they have "FENNI<KEEP>" or "FENNI<DROP>" from all fields tagged 010


When comparing or copying field dropped fields are ignored

### copyUnless (Defaults [ ])
```
{tagPattern: /010/u, copyUnless: [{"code": "9", "value": "FENNI<KEEP>"}]}
```

When field is otherwise ok to be copied, if it contains given subfield whole field is ignored

### baseValidators (Defaults {subfieldValues: false})
```
{tagPattern: /010/u, baseValidators: {fields: true, subfields: true, subfieldValues: true}}
```

Marc record validators for base record while reducer is working.
More info can be read here: https://github.com/NatLibFi/marc-record-js

### sourceValidators (Defaults {subfieldValues: false})
```
{tagPattern: /010/u, sourceValidators: {fields: true, subfields: true, subfieldValues: true}}
```

Marc record validators for source record while reducer is working.
More info can be read here: https://github.com/NatLibFi/marc-record-js

## License and copyright

Copyright (c) 2020-2023 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT** or any later version.
