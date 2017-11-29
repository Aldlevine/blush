const Builtin = require('./builtin');
const BlushError = require('../utils/error.js');

module.exports = class Export extends Builtin
{
  constructor (name, args, opts, state)
  {
    super(name, args, opts, state);
    if (args.length == 0) {
      // show all exported values
    }
    else {
      for (let arg of args) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(arg)) {
          for (let s of state.savedStates) {
            s.env[arg] = process.env[arg];
          }
        }
        else if (/^[a-zA-Z_][a-zA-Z0-9_]*=$/.test(arg)) {
          const name = arg.slice(0, -1);
          delete process.env[name]
          for (let s of state.savedStates) {
            delete process.env[name];
          }
        }
        else if (/^[a-zA-Z_][a-zA-Z0-9_]*=[^=]+$/) {
          const [name, value] = arg.split('=');
          process.env[name] = value;
          for (let s of state.savedStates) {
            s.env[name] = value;
          }
        }
        else {
          throw new BlushError(`export: not valid in this context: ${arg}`, {errno: 1});
        }
      }
    }
    process.nextTick(() => {
      this.emit('exit', 0)
    });
  }
}

