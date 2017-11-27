const glob = require('glob');
const path = require('path');

module.exports = function locateCommand (name)
{
  const paths = process.env.PATH.split(path.delimiter);
  const pattern = '{'+paths.map((p) => path.join(p, name)).join(',')+'}';
  const result = glob.sync(pattern);
  return result[0];
}
