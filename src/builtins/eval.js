const Builtin = require('./builtin');
const parse = require('../parse');

module.exports = class Eval extends Builtin
{
  constructor (name, args, ctx)
  {
    const {run} = require('../run');
    const exec = require('../exec');

    super(name, args, ctx);

    if (args.length > 0) {
      run(parse(args.join(' ')+'\n'), ctx)
      .then(() => { process.nextTick(() => this.emit('exit', 0)) })
      .catch((err) => { throw err })
    }
    else {
      process.nextTick(() => this.emit('exit', 0));
    }
  }
}

