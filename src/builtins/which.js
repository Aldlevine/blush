const Builtin = require('./builtin');
const {alias} = require('./alias');
const glob = require('glob');
const path = require('path');

module.exports = class Which extends Builtin
{
  constructor (name, args, opts, state)
  {
    super(name, args, opts, state);
    const builtins = require('./index');
    const cmdopts = {
      all: false,
      patterns: false,
      path: false,
      resolveSymlink: false,
      commandType: false,
    }
    const commands = [];
    const paths = process.env.PATH.split(path.delimiter);
    let exitCode = 0;

    for (let arg of args) {
      switch (arg) {
        case '-a': cmdopts.all = true; break;
        case '-m': cmdopts.patterns = true; break;
        case '-p': cmdopts.path = true; break;
        case '-s': cmdopts.resolveSymlink = true; break;
        case '-w': cmdopts.commandType = true; break;
        default:
          if (arg.charAt(0) == '-') {
            this._stderr.write(`which: bad option: ${arg}\n`);
            exitCode = 1;
            break;
          }
          commands.push(arg);
      }
    }

    if (!exitCode) {
      for (let cmd of commands) {
        let aliasValue = alias.getAlias(cmd);
        if (aliasValue) {
          this._stdout.write(`${cmd}: aliased to ${aliasValue}\n`);

          if (!cmdopts.all) continue;
        }
        if (cmd in builtins) {
          this._stdout.write(`${cmd}: shell built-in command\n`);

          if (!cmdopts.all) continue;
        }
        const pattern = '{'+paths.map((p) => path.join(p, cmd)).join(',')+'}';
        const result = glob.sync(pattern);
        if (result.length > 0) {
          if (cmdopts.all) {
            result.map((p) => this._stdout.write(p+'\n'));
          }
          else {
            this._stdout.write(result[0]+'\n');
          }
        }
        else {
          this._stderr.write(`${cmd} not found\n`);
          exitCode = 1;
        }
      }
    }

    process.nextTick(() => this.emit('exit', exitCode));
  }
}
