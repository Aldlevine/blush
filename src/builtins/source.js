const Builtin = require('./builtin');
const parse = require('../parse');
const parseExitCode = require('../utils/parse-exit-code');

module.exports = class Source extends Builtin
{
  constructor (name, args, opts)
  {
    super(name, args, opts);

    const {evaluate} = require('../eval');

    let exitCode = 0;

    if (args.length == 0) {
      this._stderr.write('source: not enough arguments\n');
      process.nextTick(() => this.emit('exit', 1));
    }
    else {
      let ast = parse.file(args[0]);
      evaluate(ast)
      .then(() => {
        process.nextTick(() => this.emit('exit', 0));
      }, (err) => {
        process.nextTick(() => this.emit(err));
      })
    }

  }
}

