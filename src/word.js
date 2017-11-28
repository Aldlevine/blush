const log = require('./utils/debug')('blush:word');
const os = require('os');

const $ = exports;

$.evaluate = function evaluate (word)
{
  const type = word.type.toLowerCase();
  if (!(type in $)) {
    return log('node type \'%s\' not implemented', node.type);
  }
  return $.expand($[type](word));
}

$.word = function word (word)
{
  return word.value;
}

$.dstr =
$.sstr =
$.estr = function string (word)
{
  return word.value;
}

$.loose_word = function loose_word (word)
{
  return word.parts.reduce((a, w) => a += $.evaluate(w), '');
}

$.expand = function (str)
{
  str = $.expand_tilde(str);
  str = $.expand_env(str);
  return str;
}

$.expand_env = function (str)
{
  return str.replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
    const name = match.slice(1);
    return process.env[name] || '';
  });
}

$.expand_tilde = function (str)
{
  return str.replace(/^~/, os.homedir());
}
