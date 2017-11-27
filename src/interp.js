exports.env = function env (str, map)
{
  while (/\$\w/.test(str)) {
    str = str.replace(/\$\w+/, (match) => {
      return (map[match.slice(1)] || '');
    });
  }
  return str;
}

exports.args = function args (str, arr)
{
  return str.replace(/\$\d+/, (match) => {
    return arr[Number(match.slice(1))] || '';
  }).replace(/\$@/, (match) => {
    return arr.slice(1).join(' ');
  });
}

exports.glob = function glob (str)
{
  const glob = require('glob');
  return glob.hasMagic(str) ? glob.sync(str) : str;
}
