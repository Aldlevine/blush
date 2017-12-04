const Builtin = require('./builtin');

const aliases = {};

exports.alias = class Alias extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);
    let exitCode = 0;

    if (args.length == 0) {
      for (let name in aliases) {
        this.stdout.write(`${name}='${aliases[name]}'\n`);
      }
    }
    else {
      for (let arg of args) {
        let [name, ...value] = arg.split('=');
        value = value.join('=');

        if (value.length == 0) {
          value = exports.alias.getAlias(name);
          if (value) { this.stdout.write(`${name}='${value}'\n`) }
          else { exitCode = 1 }
        }

        else { exports.alias.createAlias(name, value) }
      }
    }

    process.nextTick(() => this.emit('exit', exitCode));
  }

  static createAlias (name, value)
  {
    aliases[name] = value;
  }

  static getAlias (name)
  {
    return aliases[name];
  }

  static removeAlias (name)
  {
    if (!(name in aliases)) { return false }
    delete aliases[name];
    return true;
  }
}


exports.unalias = class Unalias extends Builtin
{
  constructor (name, args, opts)
  {
    super(name, args, opts);
    let exitCode = 0;

    if (args.length == 0) {
      this.stderr.write(`unalias: not enough arguments\n`);
      exitCode = 1;
    }
    else {
      for (let arg of args) {
        if (!exports.alias.removeAlias(arg)) {
          this.stderr.write(`unalias: no such alias ${arg}\n`);
          exitCode = 1;
        }
      }
    }

    process.nextTick(() => this.emit('exit', exitCode));
  }
}
