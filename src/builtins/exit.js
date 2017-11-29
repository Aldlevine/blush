const Builtin = require('./builtin');

module.exports = class Exit extends Builtin
{
  constructor (name, args, opts, state)
  {
    super(name, args, opts, state);

    if (args.length > 1) {
      this._stdout.write('exit: too many arguments');
    }
    else {
      const exitCode = args[0] || 0;
      process.nextTick(() => process.exit(exitCode));
    }
  }
}

