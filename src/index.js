#!/usr/bin/env node

const args = process.argv.slice(2);

// TODO: Parse options.

const REPL = require('./repl');
const repl = new REPL();
repl.start();
