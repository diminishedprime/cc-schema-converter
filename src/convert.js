import * as R from 'ramda';

const imports = `\
function getFields() {\n\
  var cc = DataStudioApp.createCommunityConnector();\n\
  var fields = cc.getFields();\n\
  var types = cc.FieldType;\n\
  var aggregations = cc.AggregationType;\n\n\
`;

const formatFn = (functionName, argument, isString) =>
  argument
    ? `.${functionName}(${isString ? "'" : ''}${argument}${
        isString ? "'" : ''
      })`
    : '';

const fieldToFieldBuilder = (includeVar) => (field) => {
  const dimensionOrField =
    field.semantics.conceptType === 'METRIC' ? 'Metric' : 'Dimension';

  const type =
    (field.semantics && field.semantics.semanticType) ||
    field.dataType === 'STRING'
      ? 'types.TEXT'
      : field.dataType === 'NUMBER'
        ? 'types.NUMBER'
        : '';

  let functions = [
    formatFn('setId', field.name, true),
    formatFn('setName', field.label, true),
    formatFn('setType', type),
    formatFn('setDescription', field.description, true),
    formatFn('setAggregation', field.defaultAggregationType),
    formatFn('setGroup', field.group, true),
    formatFn('setFormula', field.formula, true),
  ];

  const formattedFunctions = functions
    .filter((a) => a !== '')
    .map((a) => `    ${a}`)
    .join('\n');

  const varName = includeVar ? `var ${field.name.toLowerCase()} = ` : '';

  const newVar = `${varName}fields.new${dimensionOrField}()\n${formattedFunctions};\n`;
  return newVar;
};

const isDefaultDimension = (field) =>
  field.semantics.conceptType === 'DIMENSION' && field.isDefault;
const isDefaultMetric = (field) =>
  field.semantics.conceptType === 'METRIC' && field.isDefault;

export const convert = (includeVar, contents) => {
  const fixedSingleQuotes = contents.replace(/'/g, '"');
  const fixedObjectKeys = fixedSingleQuotes.replace(
    /([a-zA-Z0-9]+?):/g,
    '"$1":'
  );
  const noTrailingCommas = fixedObjectKeys.replace(/,(?=\s*?[}\]])/g, '');

  const fields = JSON.parse(noTrailingCommas);

  const asLibraryCode =
    fields.map(fieldToFieldBuilder(includeVar)).join('\n') + '\n';

  const defaultMetric = R.prop('name', fields.find(isDefaultMetric)) || '';
  const defaultMetricAdd = defaultMetric
    ? `  fields.setDefaultMetric(${defaultMetric.toLowerCase()}.getId());\n`
    : '';

  const defaultDimension =
    R.prop('name', fields.find(isDefaultDimension)) || '';
  const defaultDimensionAdd = defaultDimension
    ? `  fields.setDefaultDimension(${defaultDimension.toLowerCase()}.getId())\n`
    : '';

  const newFormat = `\
${imports}\
${asLibraryCode}\
${defaultMetricAdd}\
${defaultDimensionAdd}\
  return fields;
};\n\
\n\
function getSchema(request) {\n\
  return {'schema': getFields().build()};\n\
}\n\
`;
  return newFormat;
};
