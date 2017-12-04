#!/usr/bin/env node

const Context = require('./context');
const parseExitCode = require('./utils/parse-exit-code');
const args = process.argv.slice(2);

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

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
    const {run} = require('./run');
    for (let file of files) {
      const ctx = new Context();
      ctx.filename = file;
      await run(parse.file(file), ctx);
      exitCode = 0;
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
