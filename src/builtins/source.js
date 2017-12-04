const Builtin = require('./builtin');
const parse = require('../parse');
const parseExitCode = require('../utils/parse-exit-code');

module.exports = class Source extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    const {run} = require('../run');

    if (args.length == 0) {
      this.stderr.write('source: not enough arguments\n');
      process.nextTick(() => this.emit('exit', 1));
    }
    else {
      let ast = parse.file(args[0]);
      run(ast, ctx)
      .then(() => {
        process.nextTick(() => this.emit('exit', 0));
      }, (err) => {
        process.nextTick(() => this.emit('error', err));
      })
    }

  }
}

