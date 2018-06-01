# Community Connector Schema Converter

This library helps with the transition from manually typing out the `getSchema`
response for a Community Connector as JSON to using the new Apps Scripts
library.

## Requirements

+  A modern version of node. (must support async functions)

## Usage
Copy your existing schema into a new file. Make sure that the schema is proper
JSON. Usually you just have to make sure that the keys are strings and not
properties.

1.  `$ git clone git@github.com:diminishedprime/cc-schema-converter.git`
1.  `$ yarn install`
1.  `$ node index.js -- convert <path-to-your-file>`
