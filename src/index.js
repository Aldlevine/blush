#!/usr/bin/env node

const parseExitCode = require('./utils/parse-exit-code');
const args = process.argv.slice(2);

// TODO: Parse options.

const opts = {
};

const files = [];

for (let arg of args) {
  if (arg.charAt(0) == '-') {
    // option
  }
  else {
    // file
    files.push(arg);
  }
}

;(async () => {

  if (files.length) {
    let exitCode = 0;
    const parse = require('./parse');
    const {evaluate} = require('./eval');
    for (let file of files) {
      try {
        await evaluate(parse.file(file));
        exitCode = 0;
      }
      catch (err) {
        console.error(err.message);
        exitCode = err;
      }
    }
    process.exit(parseExitCode(exitCode));
  }
  else {
    const REPL = require('./repl');
    const repl = new REPL();
    try {
      await repl.start();
    }
    catch (err) {
      exitCode = err;
    }
  }
})();
