const commander = require('commander')
const fs = require('fs')

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

const convertField = (field) => {
  const dimensionOrField = field.semantics.conceptType === 'METRIC' ? 'Metric' : 'Dimension'

  const id = `.setId(${field.name})\n`
  const name = field.label ? `.setName(${field.label})\n` : ''
  const description = field.description ? `.setDescription(${field.description})\n` : ''
  const type = field.semantics.semanticType ? `.setType(types.${field.semantics.semanticType})` : ''
  const aggregation = field.defaultAggregationType ? `.setAggregation(aggregations.${field.defaultAggregationType})\n` : ''
  const group = field.group ? `.setGroup('${field.group}')\n` : ''

  return `\
var ${field.name} = cc.new${dimensionOrField}\n\
    ${id}\
    ${name}\
    ${description}\
    ${type}\
    ${aggregation}\
    ${group}\
`.trim() + ';\n'
}

const convert = async (schemaFilePath) => {
  const fileContents = await readFile(schemaFilePath)
  const fixedSingleQuotes = fileContents.replace(/'/g, '"')
  const schema = JSON.parse(fixedSingleQuotes)
  const converted = schema.map(convertField)
  const asLibraryCode = converted.join('\n');
  const imports = `\
var cc = DataStudioApp.getCommunityConnectorApp();\n\
var concepts = cc.ConceptType;\n\
var types = cc.FieldType;\n\
var aggregations = cc.AggregationType;\n\n\
`
  const newFormat = imports + asLibraryCode
  console.log(newFormat)
}

commander
    .command('convert <schemaFilePath>', {isDefault: true})
    .description('Convert a manual Community Connector schema to use library.')
    .action(convert)

// User input is provided from the process' arguments
commander.parse(process.argv)
