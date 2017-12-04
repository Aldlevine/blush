const Builtin = require('./builtin');

module.exports = class Chalk extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    const vm = require('vm');
    const chalk = require('chalk');

    const sandbox = {chalk};
    vm.createContext(sandbox);
    const result = vm.runInContext('chalk`'+args.join(' ')+'\n`', sandbox);

    this.stdout.write(result);
    this.exit(0);
  }
}


