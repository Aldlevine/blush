const Builtin = require('./builtin');
const path = require('path');

module.exports = class Require extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    if (args.length == 0) {
      // show all required commands
    }
    else if (args.length == 2) {

      const mod = new module.constructor('.');
      mod.paths = [path.posix.resolve(ctx.cwd, '../node_modules')];

      // TODO: This seems dangerous
      let p = mod.paths[0];
      while (p !== '/node_modules') {
        p = path.posix.resolve(p, '../../node_modules');
        mod.paths.push(p);
      }

      mod.filename = ctx.cwd+'/require.js';
      const req = mod._compile('return require', ctx.cwd+'/require.js');
      const builtinName = args[0];
      const filename = args[1];
      const filepath = req.resolve(filename);

      delete req.cache[filepath];

      try {
        require('./index')[builtinName] = req(filepath);
        this.exit(0);
      }
      catch (err) { this.error(err) }
    }
    else {
      // incorrect arguments
    }

  }
}

