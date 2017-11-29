const log = require('./utils/debug')('blush:word');
const os = require('os');

const $ = exports;

$.evaluate = async function evaluate (word, state, ctx)
{
  const type = word.type && word.type.toLowerCase();
  if (!(type in $)) {
    return log('node type \'%s\' not implemented', word.type);
  }
  return await $[type](word, state, ctx);
}

$.word = async function word (word, state, ctx)
{
  return $.expand(word.value, state, ctx);
}

$.dstr = async function string (word, state, ctx)
{
  let out = '';
  for (let part of word.parts) {
    out += await $.evaluate(part, state, ctx);
  }
  return await $.expand_env(out, state, ctx);
}

$.dstr_string =
$.sstr =
$.estr = async function string (word, state, ctx)
{
  return word.value;
}

$.loose_word = async function loose_word (word, state, ctx)
{
  let out = '';
  for (let part of word.parts) {
    out += await $.evaluate(part, state, ctx);
  }
  return out;
  // return word.parts.reduce(async (a, w) => a += await $.evaluate(w), '');
}

$.dstr_sub_word = async function dstr_sub_word (word, state, ctx)
{
  const exec = require('./exec');
  state.save();
  let out = await exec(word.list, state, ctx);
  state.restore();
  return out.replace(/\s+$/, '');
}

$.sub_word = async function sub_word (word, state, ctx)
{
  const exec = require('./exec');
  state.save();
  let out = await exec(word.list, state, ctx);
  state.restore();
  return out.replace(/\s+$/, '').replace(/\s+/g, ' ');
}

$.expand = async function (str, state, ctx)
{
  str = await $.expand_tilde(str, state, ctx);
  str = await $.expand_env(str, state, ctx);
  return str;
}

$.expand_env = async function (str, state, ctx)
{
  return str
  .replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
    const name = match.slice(1);
    return process.env[name] || '';
  })
  .replace(/\$\{[a-zA-Z_][a-zA-Z0-9_]*\}/g, (match) => {
    const name = match.slice(2, -1);
    return process.env[name] || '';
  });
}

$.expand_tilde = async function (str, state, ctx)
{
  return str.replace(/^~/, os.homedir());
}
