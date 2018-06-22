import React from 'react';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import {connect} from 'react-redux';
import {createStore} from 'redux';
import {convert} from './convert.js';
import Highlight from 'react-highlight';
import {withStyles} from '@material-ui/core/styles';
import '../node_modules/highlight.js/styles/solarized-light.css';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
    maxWidth: 900,
    margin: 'auto',
  },
});

const App = ({
  classes,
  generatedCode,
  onInputChange,
  includeVar,
  onCheckboxChange,
  schemaText,
}) => (
  <div className={classes.root}>
    <Grid container spacing={24}>
      <Grid item xs={12}>
        <AppBar position="static" color="default">
          <Toolbar>
            <Typography variant="title" color="inherit">
              Data Studio Schema Updater
            </Typography>
          </Toolbar>
        </AppBar>
      </Grid>
      <Grid item xs={7}>
        <Paper>
          <Highlight className="javascript">{generatedCode}</Highlight>
        </Paper>
      </Grid>
      <Grid item xs={5}>
        <FormControlLabel
          control={
            <Checkbox
              checked={includeVar}
              onChange={onCheckboxChange}
              color="primary"
            />
          }
          label="Include var"
        />
        <TextField
          label="Schema"
          helperText="Paste your original schema here."
          text={schemaText}
          multiline={true}
          fullWidth
          rowsMax={10}
          onChange={onInputChange}
        />
      </Grid>
    </Grid>
  </div>
);

const mapDispatchToProps = (dispatch) => ({
  onInputChange: (e) => dispatch({type: 'schemaChange', value: e.target.value}),
  onCheckboxChange: (e) =>
    dispatch({type: 'checkboxChange', value: e.target.checked}),
});

const mapStateToProps = (state) => ({
  generatedCode: state.generatedCode,
  includeVar: state.includeVar,
  schemaText: state.schemaText,
});

const initialState = {
  generatedCode: '// No code yet. Paste your schema in the Schema text input.',
  schemaText: '',
  includeVar: false,
};

const schemaChange = (state, {value}) => {
  let generatedCode = 'Could not generate.';
  try {
    generatedCode = convert(state.includeVar, value);
  } catch (e) {}
  return Object.assign({}, state, {generatedCode, schemaText: value});
};

const checkboxChange = (state, {value}) => {
  const includeVar = value;
  let generatedCode = 'Could not generate.';
  try {
    generatedCode = convert(includeVar, state.schemaText);
  } catch (e) {}
  return Object.assign({}, state, {includeVar, generatedCode});
};

const app = (state = initialState, action) => {
  switch (action.type) {
    case 'schemaChange':
      return schemaChange(state, action);
    case 'checkboxChange':
      return checkboxChange(state, action);
    default:
      return state;
  }
};

export const makeStore = () => {
  return createStore(app);
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(App));
