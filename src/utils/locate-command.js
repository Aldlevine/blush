const BlushError = require('./error.js');
const glob = require('glob');
const path = require('path');
const log = require('./debug')('blush:locate-command');
const fs = require('fs');

module.exports = function locateCommand (name, local, ctx)
{
  let pattern;
  let isFile = local;

  if (local) { pattern = path.resolve(ctx.cwd, name) }
  else if (/^(~|\/)/.test(name)) {
    isFile = true;
    pattern = name;
  }
  else {
    paths = ctx.env.PATH.split(path.delimiter);
    pattern = '{'+paths.map((p) => path.resolve(p, name)).join(',')+'}';
  }

  const result = glob.sync(pattern)[0];

  if (result) {
    const stats = fs.statSync(result);

    if (stats.isFile()) {
      try { fs.accessSync(result, fs.constants.X_OK) }
      catch (err) { throw new BlushError(`permission denied`, 126) }
      return result;
    }

    if (stats.isDirectory()) { throw new BlushError(`is a directory`, 126) }
  }

  if (isFile) { throw new BlushError(`no such file or directory`, 127) }

  throw new BlushError(`command not found`, 127)
}
