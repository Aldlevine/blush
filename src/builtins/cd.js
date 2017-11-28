const Builtin = require('./builtin');
const os = require('os');

module.exports = class Cd extends Builtin
{
  constructor (name, args, opts)
  {
    super(name, args, opts);
    if (args.length == 0) {
      process.chdir(os.homedir());
    }
    else {
      process.chdir(args.join(' '));
    }
    process.nextTick(() => this.emit('exit', 0));
  }
}
