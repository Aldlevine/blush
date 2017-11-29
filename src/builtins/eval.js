const Builtin = require('./builtin');
const parse = require('../parse');

module.exports = class Eval extends Builtin
{
  constructor (name, args, opts, state)
  {
    const {run} = require('../run');
    const exec = require('../exec');
    super(name, args, opts, state);
    if (args.length > 0) {
      run(parse(args.join(' ')+'\n'), state)
      .then(() => {
        process.nextTick(() => this.emit('exit', 0));
      })
      .catch((err) => {
        throw err
      })
    }
    else {
      process.nextTick(() => this.emit('exit', 0));
    }
  }
}

