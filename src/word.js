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
  const vm = require('vm');
  const filename = typeof ctx.filename === 'string' ? ctx.filename : ctx.cwd + '/VM.js';
  const dirname = path.dirname(filename);

  const mod = new module.constructor(filename);
  mod.paths = [path.posix.resolve(filename, '../node_modules')];
  let p = mod.paths[0];

  // TODO: This seems dangerous
  while (p !== '/node_modules') {
    p = path.posix.resolve(p, '../../node_modules');
    mod.paths.push(p);
  }

  mod.filename = filename;

  const req = mod._compile('return require', filename);
  const sandbox = vm.createContext({
    require: req,
  });

  const code = await $.expand(word.value, ctx);
  try {
    const result = vm.runInContext(code, sandbox, {breakOnSigint: true});
    if (typeof result === 'undefined') return '';
    return result+'';
  }
  catch (vmerr) {
    const err = new BlushError(vmerr && vmerr.message || vmerr, {source: 'javascript', errno: 1});
    err.stack = vmerr.stack;
    throw err;
  }
}

// $._js_word = async function js_word (word, ctx)
// {
//   const {NodeVM} = require('vm2');
//   const filename = typeof ctx.filename === 'string' ? ctx.filename : ctx.cwd + '/VM.js';
//   const dirname = path.dirname(filename);
//   const vm = new NodeVM({
//     console: 'off',
//     sandbox: {},
//     require: {
//       external: true,
//       builtin: ['*'],
//       context: 'sandbox',
//     },
//     wrapper: 'none',
//   });

//   try {
//     const result = (vm.run(await $.expand(word.value, ctx), filename))+'';
//     return result;
//   }
//   catch (vmerr) {
//     const err = new BlushError(vmerr.message, {source: 'javascript', errno: 1});
//     err.stack = vmerr.stack;
//     throw err;
//   }
// }

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
