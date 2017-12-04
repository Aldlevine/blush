const BlushError = require('./utils/error');
const log = require('./utils/debug')('blush:word');
const path = require('path');
const os = require('os');

const $ = exports;

$.evaluate = async function evaluate (word, ctx)
{
  if (word instanceof Array) {
    let result = '';
    for (let part of word) {
      try { result += await $.evaluate(part, ctx) }
      catch (err) { break }
    }
    return result;
  }

  const type = word.type && word.type.toLowerCase();

  if (!(type in $)) {
    return log('node type \'%s\' not implemented', word.type);
  }
  return await $[type](word, ctx);
}

$.word = async function word (word, ctx)
{
  return $.expand(word.value, ctx);
}

$.dstr = async function string (word, ctx)
{
  let out = '';
  for (let part of word.parts) { out += await $.evaluate(part, ctx) }
  return await $.expand_env(out, ctx);
}

$.dstr_string =
$.sstr =
$.estr = async function string (word, ctx)
{
  return word.value;
}

$.loose_word = async function loose_word (word, ctx)
{
  let out = '';
  for (let part of word.parts) { out += await $.evaluate(part, ctx) }
  return out;
}

$.dstr_sub_word = async function dstr_sub_word (word, ctx)
{
  const exec = require('./exec');
  let out = await exec(word.list, ctx);
  return out.replace(/\s+$/, '');
}

$.sub_word = async function sub_word (word, ctx)
{
  const exec = require('./exec');
  let out = await exec(word.list, ctx);
  return out.replace(/\s+$/, '').replace(/\s+/g, ' ');
}

$.js_word = async function js_word (word, ctx)
{
  const {NodeVM} = require('vm2');
  const dirname = typeof ctx.filename ==='string' ? path.dirname(ctx.filename) : ctx.cwd;
  const vm = new NodeVM({
    console: 'off',
    sandbox: {},
    require: {
      external: true,
      builtin: ['*'],
      context: 'sandbox',
    },
    wrapper: 'none',
  });

  try {
    // return vm.runInNewContext(await $.expand(word.value, ctx), {
    //   __filename: ctx.filename,
    //   __dirname: path.dirname(ctx.filename),
    // }, {
    //   filename: ctx.filename
    // }).toString();
    const result = (vm.run(await $.expand(word.value, ctx), ctx.filename))+'';
    return result;
  }
  catch (vmerr) {
    const err = new BlushError(vmerr.message, {source: 'javascript', errno: 1});
    err.stack = vmerr.stack;
    throw err;
  }
}

$.expand = async function (str, ctx)
{
  str = await $.expand_tilde(str, ctx);
  str = await $.expand_env(str, ctx);
  return str;
}

$.expand_env = async function (str, ctx)
{
  return str
  // .replace(/\$\?/g, () => ctx.exitCode)
  .replace(/\$([a-zA-Z_][a-zA-Z0-9_]*|\?)/g, (match) => {
    const name = match.slice(1);
    return name in ctx.env ? ctx.env[name] : '';
  })
  .replace(/\$\{([a-zA-Z_][a-zA-Z0-9_]*|\?)\}/g, (match) => {
    const name = match.slice(2, -1);
    return name in ctx.env ? ctx.env[name] : '';
  });
}

$.expand_tilde = async function (str, ctx)
{
  return str.replace(/^~/, os.homedir());
}
