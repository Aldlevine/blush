const Builtin = require('./builtin');
const BlushError = require('../utils/error');

module.exports = class Javascript extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    const term = args.pop();
    if (term !== ']') {
      return this.exit(new BlushError(`command must be terminated with ']'`, {errno: 1, source: 'javascript'}))
    }

    const vm = require('vm');

    let result;

    try {
      result = vm.runInNewContext(args.join(' '), {});
    }
    catch (vmerr) {
      const err = new BlushError(vmerr.message);
      err.stack = vmerr.stack;
      err.source = '@[';
      return this.error(err);
    }

    this.stdout.write(result+'\n');
    this.exit(0);
  }
}



