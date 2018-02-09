const commander = require('commander')
const fs = require('fs')
const R = require('ramda')

const imports = `\
var cc = DataStudioApp.getCommunityConnectorApp();\n\
var concepts = cc.ConceptType;\n\
var types = cc.FieldType;\n\
var aggregations = cc.AggregationType;\n\n\
`

const fieldsBuilderPrefix = `\
var schema = cc.newFieldsBuilder()\n\
`
const fieldsBuilderPostfix = `\
    .build();
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

  const id = `.setId(${field.name})\n`
  const name = field.label ? `.setName(${field.label})\n` : ''
  const description = field.description ? `.setDescription(${field.description})\n` : ''
  const type = field.semantics.semanticType ? `.setType(types.${field.semantics.semanticType})` : ''
  const aggregation = field.defaultAggregationType ? `.setAggregation(aggregations.${field.defaultAggregationType})\n` : ''
  const group = field.group ? `.setGroup('${field.group}')\n` : ''
  const formula = field.formula ? `.setFormula('${field.formula}')\n` : ''


  const newVar = `\
var ${field.name} = cc.new${dimensionOrField}\n\
    ${id}\
    ${name}\
    ${description}\
    ${type}\
    ${aggregation}\
    ${group}\
    ${formula}\
`.trim() + ';\n'
  return newVar
}

const isDefaultDimension = (field) => field.semantics.conceptType === 'DIMENSION' && field.isDefault
const isDefaultMetric = (field) => field.semantics.conceptType === 'METRIC' && field.isDefault

const convert = async (fieldsFilePath) => {
  const fileContents = await readFile(fieldsFilePath)
  const fixedSingleQuotes = fileContents.replace(/'/g, '"')
  const fields = JSON.parse(fixedSingleQuotes)

  const asLibraryCode = fields.map(fieldToFieldBuilder).join('\n') + '\n'

  const fieldAdds = fields.map((field) => `    .addField(${field.name})`).join('\n') + '\n'

  const defaultMetric = R.prop('name', fields.find(isDefaultMetric)) || ''
  const defaultMetricAdd = defaultMetric ? `    .setDefaultMetric(${defaultMetric}.getId())\n` : ''

  const defaultDimension = R.prop('name', fields.find(isDefaultDimension)) || ''
  const defaultDimensionAdd = defaultDimension ? `    .setDefaultDimension(${defaultDimension}.getId())\n` : ''

  const newFormat = `\
${imports}\
${asLibraryCode}\
${fieldsBuilderPrefix}\
${fieldAdds}\
${defaultMetricAdd}\
${defaultDimensionAdd}\
${fieldsBuilderPostfix}
`
  console.log(newFormat)
}

commander
    .command('convert <fieldsFilePath>', {isDefault: true})
    .description('Convert a manual Community Connector fields to use library.')
    .action(convert)

// User input is provided from the process' arguments
commander.parse(process.argv)
