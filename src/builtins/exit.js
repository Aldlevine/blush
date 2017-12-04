const Builtin = require('./builtin');

module.exports = class Exit extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    if (args.length > 1) {
      this.stdout.write('exit: too many arguments');
    }
    else {
      const exitCode = args[0] || 0;
      process.nextTick(() => process.exit(exitCode));
    }
  }
}

