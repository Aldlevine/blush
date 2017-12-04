const Builtin = require('./builtin');
const BlushError = require('../utils/error');
const fs = require('fs');

module.exports = class Pwd extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    let opts = {
      logical: false,
      physical: false,
    }

    for (let arg of args) {
      switch (arg) {
        case '-L':
        case '--logical':
          opts.logical = true;
          break;
        case '-P':
        case '--physical':
          opts.physical = true;
          break;
        default:
          return this.error(new BlushError('bad option: '+arg), {errno: 1, source: 'pwd'})
      }
    }

    if (opts.physical) {
      this.stdout.write(fs.realpathSync(ctx.cwd)+'\n');
    }
    else {
      this.stdout.write(ctx.cwd+'\n');
    }

    return this.exit(0);

    // process.nextTick(() => process.exit(exitCode));
  }
}


