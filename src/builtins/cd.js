const Builtin = require('./builtin');

module.exports = class Cd extends Builtin
{
  constructor (name, args, opts)
  {
    super(name, args, opts);
    process.chdir(args.join(' '));
    process.nextTick(() => this.emit('exit', 0));
  }
}
