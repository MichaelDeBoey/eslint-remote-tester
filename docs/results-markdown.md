## Rule: react/no-unstable-nested-components
- Message: `Declare this component outside parent component "NestedGrid" or memoize it.`
- Path: `mui-org/material-ui/docs/src/pages/components/grid/NestedGrid.js`
- [Link](https://github.com/mui-org/material-ui/blob/HEAD/docs/src/pages/components/grid/NestedGrid.js#L20-L34)
```js

export default function NestedGrid() {
  const classes = useStyles();

  function FormRow() {
    return (
      <React.Fragment>
        <Grid item xs={4}>
          <Paper className={classes.paper}>item</Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper className={classes.paper}>item</Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper className={classes.paper}>item</Paper>
        </Grid>
      </React.Fragment>
    );
  }

  return (
    <div className={classes.root}>
      <Grid container spacing={1}>
        <Grid container item xs={12} spacing={3}>
```

## Rule: jsx-handler-names
- Message: `Cannot read property 'object' of undefined
Occurred while linting <text>:15`
- Path: `mui-org/material-ui/docs/src/modules/components/AdGuest.js`
- [Link](https://github.com/mui-org/material-ui/blob/HEAD/docs/src/modules/components/AdGuest.js#L0)
```js
TypeError: Cannot read property 'object' of undefined
Occurred while linting <text>:15
    at JSXAttribute (/<removed>/eslint-plugin-react/lib/rules/jsx-handler-names.js:112:52)
    at /<removed>/eslint-remote-tester/node_modules/eslint/lib/linter/safe-emitter.js:45:58
    at Array.forEach (<anonymous>)
    at Object.emit (/<removed>/eslint-remote-tester/node_modules/eslint/lib/linter/safe-emitter.js:45:38)
    at NodeEventGenerator.applySelector (/<removed>/eslint-remote-tester/node_modules/eslint/lib/linter/node-event-generator.js:254:26)
    at NodeEventGenerator.applySelectors (/<removed>/eslint-remote-tester/node_modules/eslint/lib/linter/node-event-generator.js:283:22)
    at NodeEventGenerator.enterNode (/<removed>/eslint-remote-tester/node_modules/eslint/lib/linter/node-event-generator.js:297:14)
    at CodePathAnalyzer.enterNode (/<removed>/eslint-remote-tester/node_modules/eslint/lib/linter/code-path-analysis/code-path-analyzer.js:711:23)
    at /<removed>/eslint-remote-tester/node_modules/eslint/lib/linter/linter.js:952:32
    at Array.forEach (<anonymous>)
```

## Rule: react/jsx-handler-names
- Message: `Handler function for onClick prop key must be a camelCase name beginning with 'handle' only`
- Path: `mui-org/material-ui/docs/src/pages/components/accordion/ActionsInAccordionSummary.js`
- [Link](https://github.com/mui-org/material-ui/blob/HEAD/docs/src/pages/components/accordion/ActionsInAccordionSummary.js#L31-L31)
```js
          id="additional-actions1-header"
        >
          <FormControlLabel
            aria-label="Acknowledge"
            onClick={(event) => event.stopPropagation()}
            onFocus={(event) => event.stopPropagation()}
            control={<Checkbox />}
            label="I acknowledge that I should stop the click event propagation"
          />
        </AccordionSummary>
```