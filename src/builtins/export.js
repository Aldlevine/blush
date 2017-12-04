const Builtin = require('./builtin');
const BlushError = require('../utils/error.js');

module.exports = class Export extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);
    if (args.length == 0) {
      // TODO: show all exported values
    }
    else {
      for (let arg of args) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(arg)) {
          ctx.exports.push(arg);
        }
        else if (/^[a-zA-Z_][a-zA-Z0-9_]*=$/.test(arg)) {
          const name = arg.slice(0, -1);
          delete ctx.env[name];
          ctx.exports.push(name);
        }
        else if (/^[a-zA-Z_][a-zA-Z0-9_]*=[^=]+$/) {
          const [name, value] = arg.split('=');
          ctx.env[name] = value;
          ctx.exports.push(name);
        }
        else {
          throw new BlushError(`not valid in this context: ${arg}`, {
            errno: 1,
            source: 'exports',
          });
        }
      }
    }
    process.nextTick(() => {
      this.emit('exit', 0)
    });
  }
}

