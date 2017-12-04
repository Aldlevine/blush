const $ = exports;
const locateCommand = require('./utils/locate-command');
const readShebang = require('./utils/read-shebang');
const parseExitCode = require('./utils/parse-exit-code');
const print = require('./utils/printer');
const Context = require('./context');
const BlushError = require('./utils/error');
const parse = require('./parse');
const builtins = require('./builtins');
const log = require('./utils/debug')('blush:run');
const {PassThrough} = require('stream');
const {spawn} = require('child_process');
const {Socket} = require('net');
const fs = require('fs');

$.run = async function (node, ctx = new Context())
{
  try {
    await $.evaluate(node, ctx)
    return 0;
  }
  catch (err) {
    log(err);
    print.err(ctx, err);
    return parseExitCode(err);
  }
}

$.evaluate = async function (node, ctx)
{
  if (node instanceof Array) {
    for (let node of node) {
      try { await $.evaluate(node, ctx) }
      catch (err) { break }
    }
    return;
  }

  if (!node || !(node.type in $)) {
    return log('node type \'%s\' not implemented', node && node.type || node);
  }

  return await $[node.type](node, ctx);
}

$.program = async function (node, ctx)
{
  log('evaluate program');
  const {body} = node;
  return body && await $.evaluate(body, ctx);
}

$.list = async function (node, ctx)
{
  log('evaluate list');
  const {commands} = node;

  let exitCode = 0;

  for (let i=0, ii=commands.length; i<ii; i++) {
    const cmd = commands[i];

    if (cmd.type === 'assign') {
      await $.evaluate(cmd, ctx);
      continue;
    }

    const cmd_ctx = ctx.clone();
    const modifier = cmd.modifier && await $.evaluate(cmd.modifier, cmd_ctx);

    log('modifier: %s; exit-code: %d', modifier, exitCode);
    if (modifier == 'and' && !!exitCode) { continue }
    if (modifier == 'or' && !exitCode) { continue }

    let stdout = cmd_ctx.stdio[1];
    if (stdout && stdout.fd !== 1) {
      cmd_ctx.stdio[1] = new PassThrough;

      cmd_ctx.stdio[1]
      .on('data', (data) => {
        stdout.write(data);
      });
    }

    if (ctx.requestInputStream) {
      cmd_ctx.requestInputStream = ctx.requestInputStream;
      ctx.requestInputStream = 'ignore';
    }

    try {
      await $.evaluate(cmd, cmd_ctx);
      ctx.exitCode = exitCode = 0;
    }
    catch (err) {
      exitCode = err;
      ctx.exitCode = parseExitCode(err);
    }
  }

  // TODO: Working on piping into a list. Probably need to switch from 'pipe'
  // to 'ignore' when 'end' is received on the piping command's stdout.

  if (ctx.stdio[1] && ctx.stdio[1].end && (!('fd' in ctx.stdio[1]) || ctx.stdio[1].fd > 2)) {
    ctx.stdio[1].end();
  }

  if (exitCode !== 0) { throw exitCode }
}

const NS_PER_SEC = 1e9;
const US_PER_SEC = 1e6;
const MS_PER_SEC = 1e3;

$.pipeline = async function (node, ctx)
{
  log('evaluate pipeline');

  const {commands, time, negate} = node;

  let exitCode = 0;

  let start;
  if (time) { start = process.hrtime() }

  const promises = [];
  const pipeline = commands.slice().reverse();
  let cmd, stream;

  while (cmd = pipeline.shift()) {
    try {
      await new Promise(async (res, rej) => {
        const cmd_ctx = ctx.clone();

        if (stream) { cmd_ctx.stdio[1] = stream }

        if (pipeline.length) cmd_ctx.requestInputStream = (err, str) => {
          if (err) return rej(err);
          stream = str;
          res();
        }
        else if (ctx.requestInputStream) {
          cmd_ctx.requestInputStream = ctx.requestInputStream;
        }

        // Redirs here?
        if (cmd.redir) {
          for (let r of cmd.redir) {
            try {
              await $.evaluate(r, cmd_ctx)
              if (r.io == 1 && stream) process.nextTick(() => stream.end())
            }
            catch (err) {
              print.err(ctx, err);
              stream && stream.end();
              return rej(err);
            }
          }
        }

        try {
          promises.push($.evaluate(cmd, cmd_ctx).catch((err) => {
            stream && stream.end();
            exitCode = err;
          }));
        }
        catch (err) {
          stream && stream.end();
          return rej(err)
        }

        if (pipeline.length == 0) { res() }
      });
    }
    catch (err) { break }
  }

  try {
    await Promise.all(promises);
    if (negate) { ctx.exitCode = exitCode = 1 }
  }
  catch (err) {
    // for (let stream of streams) {
    //   stream.end();
    // }
    if (negate) { ctx.exitCode = exitCode = 0 }
    else {
      ctx.exitCode = parseExitCode(err);
      exitCode = err;
    }
  }

  if (time) {
    const d = process.hrtime(start);
    let time = d[0] * NS_PER_SEC + d[1];
    let unit = 'ns';
    if (time > NS_PER_SEC) {
      time /= NS_PER_SEC;
      unit = 's';
    }
    else if (time > NS_PER_SEC/MS_PER_SEC) {
      time /= NS_PER_SEC/MS_PER_SEC;
      unit = 'ms';
    }
    else if (time > NS_PER_SEC/US_PER_SEC) {
      time /= NS_PER_SEC/US_PER_SEC;
      unit = 'us';
    }
    print.out(ctx, `${time.toFixed(2)}${unit}`);
  }

  if (exitCode !== 0) { throw exitCode }
}


$.simple_cmd = async function (node, ctx)
{
  let name = origName = await $.word(node.name, ctx);
  let args = [];
  for (let arg of node.args) {
    args.push(await $.word(arg, ctx));
  }

  const exports = [];
  if (node.params) {
    for (let p of node.params) {
      exports.push(p.name);
      await $.evaluate(p, ctx);
    }
  }

  log('evaluate simple_cmd "%s"', name);

  if (typeof ctx.requestInputStream === 'function') { ctx.stdio[0] = 'pipe' }
  else if (ctx.requestInputStream === 'ignore') { ctx.stdio[0] = 'pipe' }

  const stdout = ctx.stdio[1];
  if (isNaN(stdout.fd)) { ctx.stdio[1] = 'pipe' }

  await new Promise(async (res, rej) => {
    let proc;
    let alias = builtins.alias.getAlias(name);

    if (alias) {
      let [aliasName, ...aliasArgs] = alias.split(' ');
      name = aliasName;
      args = [...aliasArgs, ...args];
    }

    if (name in builtins) {
      proc = new builtins[name](name, args, ctx);
    }
    else {
      let cmdpath;

      try {
        cmdpath = locateCommand(name, node.dot, ctx.clone({env: process.env}));
      }
      catch (err) {
        err.source = origName;
        print.err(ctx, err);
        if (ctx.requestInputStream) {
          ctx.requestInputStream(err);
        }
        return rej(err);
      }

      // This is here to speed up running blush scripts {{{
      const shebang = await readShebang(cmdpath);
      if (/(^|\s|\/)blush$/.test(shebang)) {
        const src = fs.readFileSync(cmdpath, 'utf-8');
        try {
          const ast = parse(src);
          if (!ast) {
            return rej(new BlushError('invalid syntax:\n\nUnexpected end of input\n', {errno: 1, source: name}));
          }
          ctx.stdio[1] = stdout;
          ctx.filename = cmdpath;
          return res(await $.evaluate(ast, ctx.clone({subshell: true, exports})));
        }
        catch (err) {
          return rej(err);
        }
      }
      // }}}

      ctx.argv0 = origName;
      proc = spawn(cmdpath, args, ctx.generate(exports));
    }

    if (typeof ctx.requestInputStream === 'function') {
      ctx.requestInputStream(null, proc.stdio[0]);
      proc.stdin.on('error', (err) => {
        err.source = origName;
        print.err(ctx, err)
        rej(err);
      })
    }
    else if (ctx.requestInputStream === 'ignore') {
      proc.stdin.end();
    }

    if (ctx.stdio[1] === 'pipe') {
      proc.stdout
      .on('data', (data) => {
        stdout.write(data.toString());
      })
      .on('end', () => {
        if (!stdout.isTTY) { stdout.end() }
      })
      .on('error', (err) => {
        err.source = origName;
        if (!stdout.isTTY) { stdout.end(err) }
      })
    }

    proc
    .on('exit', (code, signal) => {
      log('exit "%s"', name);
      if (code || signal) { return rej(code || signal) }
      res();
    })
    .on('error', (err) => {
      log('error "%s"', name);
      err.source = origName;
      print.err(ctx, err);
      rej(err);
    })
  });
}

$.group_cmd = async function (node, ctx)
{
  log('evaluate group_cmd');
  return await $.evaluate(node.list, ctx);
}

$.if_cmd = async function (node, ctx)
{
  log('evaluate if_cmd');

  await $.evaluate(node.if, ctx)
  .then(async () => {
    await $.evaluate(node.then, ctx);
  })
  .catch(async (err) => {
    await $.evaluate(node.else, ctx);
  })
}

$.subshell_cmd = async function (node, ctx)
{
  log('evaluate subshell_cmd');
  await $.evaluate(node.list, ctx.clone({subshell: true}));
}

$.redir_ofile = async function (node, ctx)
{
  log('evaluate redir_ofile');
  const fname = await $.word(node.fname, ctx);
  ctx.stdio.openTrunc(fname, node.io);
}

$.redir_iofile = async function (node, ctx)
{
  log('evaluate redir_iofile');
  const fname = await $.word(node.fname, ctx);
  ctx.stdio.openReadWrite(fname, node.io);
}

$.redir_fd = async function (node, ctx)
{
  log('evaluate redir_fd');
  ctx.stdio.redir(node.io, node.to);
}

$.assign = async function (node, ctx)
{
  log('evaluate assign');
  const {name, value} = node;
  const env = node.local ? ctx.env : ctx.top.env;
  if (value) {
    let res = await $.word(value, ctx);
    env[name] = res;
  }
  else { delete env[name] }
}

$.AND = function (node, ctx)
{
  return 'and';
}

$.OR = function (node, ctx)
{
  return 'or';
}

$.word = require('./word').evaluate;
