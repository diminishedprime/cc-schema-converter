const commander = require('commander')
const fs = require('fs')
const R = require('ramda')

const imports = `\
function getFields() {\n\
  var cc = DataStudioApp.createCommunityConnector();\n\
  var fields = cc.getFields();\n\
  var types = cc.FieldType;\n\
  var aggregations = cc.AggregationType;\n\n\
`

const readFile = async (filename) => {
  return new Promise(function(resolve, reject) {
    fs.readFile(filename, 'utf8', function(err, data){
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const fieldToFieldBuilder = (field) => {
  const dimensionOrField = field.semantics.conceptType === 'METRIC' ? 'Metric' : 'Dimension'

  const  id           =  field.name                    ?  `.setId('${field.name}')\n`                                        :  ''
  const  name         =  field.label                   ?  `.setName('${field.label}')\n`                                     :  ''
  const  description  =  field.description             ?  `.setDescription('${field.description}')\n`                        :  ''
  const  type         =  field.semantics.semanticType  ?  `.setType(types.${field.semantics.semanticType})\n`                :  ''
  const  aggregation  =  field.defaultAggregationType  ?  `.setAggregation(aggregations.${field.defaultAggregationType})\n`  :  ''
  const  group        =  field.group                   ?  `.setGroup('${field.group}')\n`                                    :  ''
  const  formula      =  field.formula                 ?  `.setFormula('${field.formula}')\n`                                :  ''


  const newVar = `\
  var ${field.name.toLowerCase()} = fields.new${dimensionOrField}()\n\
      ${id}\
      ${name}\
      ${description}\
      ${type}\
      ${aggregation}\
      ${group}\
      ${formula}\
`.trimRight() + ';\n';
  return newVar
}

const isDefaultDimension = (field) => field.semantics.conceptType === 'DIMENSION' && field.isDefault
const isDefaultMetric = (field) => field.semantics.conceptType === 'METRIC' && field.isDefault

const convert = async (fieldsFilePath) => {
  const fileContents = await readFile(fieldsFilePath)
  const fixedSingleQuotes = fileContents.replace(/'/g, '"')
  const fields = JSON.parse(fixedSingleQuotes)

  const asLibraryCode = fields.map(fieldToFieldBuilder).join('\n') + '\n'

  const defaultMetric = R.prop('name', fields.find(isDefaultMetric)) || ''
  const defaultMetricAdd = defaultMetric ? `  fields.setDefaultMetric(${defaultMetric.toLowerCase()}.getId());\n` : ''

  const defaultDimension = R.prop('name', fields.find(isDefaultDimension)) || ''
  const defaultDimensionAdd = defaultDimension ? `  fields.setDefaultDimension(${defaultDimension.toLowerCase()}.getId())\n` : ''

  const newFormat = `\
${imports}\
${asLibraryCode}\
${defaultMetricAdd}\
${defaultDimensionAdd}\
  return fields;
};\n\
\n\
function getSchema(request) {\n\
  return getFields().validateAndBuild();\n\
}\n\
`
  console.log(newFormat)
}

commander
    .command('convert <fieldsFilePath>', {isDefault: true})
    .description('Convert a manual Community Connector fields to use library.')
    .action(convert)

// User input is provided from the process' arguments
commander.parse(process.argv)
