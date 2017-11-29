const $ = exports;
const locateCommand = require('./utils/locate-command');
const parseExitCode = require('./utils/parse-exit-code');
const print = require('./utils/print');
const State = require('./state');
const builtins = require('./builtins');
const log = require('./utils/debug')('blush:run');
const {PassThrough} = require('stream');
const {spawn} = require('child_process');
const fs = require('fs');

$.run = async function (...args)
{
  try {
    await $.evaluate(...args);
  }
  catch (err) {
    log(err);
    print.err(err);
    return parseExitCode(err);
  }

  return 0;
}

$.evaluate = async function (node, state=new State, ctx={})
{
  if (node instanceof Array) {
    for (let node of node) {
      await $.evaluate(node, state, ctx);
    }
    return;
  }

  if (!node || !(node.type in $)) {
    return log('node type \'%s\' not implemented', node && node.type || node);
  }

  return await $[node.type](node, state, ctx);
}

$.program = async function (node, state, ctx)
{
  log('evaluate program');
  const {body} = node;
  return body && await $.evaluate(body, state, ctx);
}

$.list = async function (node, state, ctx)
{
  log('evaluate list');
  const {commands} = node;
  const {pipe_stdin, pipe_stdout} = ctx;

  let exitCode = 0;

  for (let i=0, ii=commands.length; i<ii; i++) {
    const cmd = commands[i];
    const cmd_ctx = {};
    const modifier = cmd.modifier && await $.evaluate(cmd.modifier);

    log('modifier: %s; exit-code: %d', modifier, exitCode);
    if (modifier == 'and' && !!exitCode) {
      continue;
    }
    if (modifier == 'or' && !exitCode) {
      continue;
    }

    if (pipe_stdin) {
      cmd_ctx.pipe_stdin = pipe_stdin;
    }

    if (pipe_stdout) {
      cmd_ctx.pipe_stdout = new PassThrough;
      cmd_ctx.pipe_stdout
      .on('data', (data) => {
        pipe_stdout.write(data);
      })
      .on('error', (err) => {
      })
    }

    try {
      await $.evaluate(cmd, state, cmd_ctx);
      exitCode = 0;
    }
    catch (err) {
      log('command errored %O', err);
      exitCode = err;
    }
  }

  if (pipe_stdout) {
    pipe_stdout.end();
  }

  if (exitCode !== 0) {
    throw exitCode;
  }
}

const NS_PER_SEC = 1e9;
const US_PER_SEC = 1e6;
const MS_PER_SEC = 1e3;

$.pipeline = async function (node, state, ctx)
{
  log('evaluate pipeline');

  const promises = [];
  const {commands, time, negate} = node;
  const {pipe_stdin, pipe_stdout, redir} = ctx;

  const streams = [];
  let stream = null;
  let exitCode = 0;

  let start;
  if (time) {
    start = process.hrtime();
  }

  for (let i=0, ii=commands.length; i<ii; i++) {
    const cmd_ctx = {};
    const cmd = commands[i];

    if (i == 0) cmd_ctx.pipe_stdin = pipe_stdin;
    else cmd_ctx.pipe_stdin = stream;

    if (i == ii-1) cmd_ctx.pipe_stdout = pipe_stdout;
    else streams.push(cmd_ctx.pipe_stdout = stream = new PassThrough);

    cmd_ctx.redir = redir;

    promises.push($.evaluate(cmd, state, cmd_ctx).catch((err) => {
      cmd_ctx.pipe_stdin && cmd_ctx.pipe_stdin.end();
      cmd_ctx.pipe_stdout && cmd_ctx.pipe_stdout.end();
      exitCode = err;
    }));
  }

  try {
    await Promise.all(promises);
    if (negate) {
      exitCode = 1;
    }
  }
  catch (err) {
    // for (let stream of streams) {
    //   stream.end();
    // }
    if (negate) {
      exitCode = 0;
    }
    else {
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
    print(`${time.toFixed(2)}${unit}`);
  }

  if (exitCode !== 0) {
    throw exitCode;
  }
}

/**
 * TODO: restore stdin if not consumed
 */
$.simple_cmd = async function (node, state, ctx)
{
  let name = origName = await $.word(node.name, state, ctx);
  let args = [];
  for (let arg of node.args) {
    args.push(await $.word(arg, state, ctx));
  }

  log('evaluate simple_cmd "%s"', name);

  const stdio = [0,1,2];
  ctx.stdio = ctx.stdio || [];

  if (ctx.pipe_stdin) {
    log('pipe into "%s"', name);
    stdio[0] = 'pipe';
    ctx.stdio[0] = ctx.pipe_stdin;
  }

  if (ctx.pipe_stdout) {
    log('pipe out of "%s"', name);
    stdio[1] = 'pipe';
    ctx.stdio[1] = ctx.pipe_stdout;
  }

  const redirs = {};
  for (let r of node.redir) {
    if (!r) continue;
    const {type, io, stream, to} = await $.evaluate(r);

    redirs[io] = redirs[io] || [];

    stdio[io] = 'pipe';
    if (type === 'fd') {
      redirs[io].push(to);
    }
    else {
      redirs[io].push(stream);
    }
  }

  state.save();
  await new Promise((res, rej) => {
    let proc;
    let alias = builtins.alias.getAlias(name);
    if (alias) {
      let [aliasName, ...aliasArgs] = alias.split(' ');
      name = aliasName;
      args = [...aliasArgs, ...args];
    }
    if (name in builtins) {
      proc = new builtins[name](name, args, {stdio, argv0: origName}, state);
    }
    else {
      let cmdpath;

      cmdpath = locateCommand(name, node.dot);

      proc = spawn(cmdpath, args, {stdio, argv0: origName, env: state.env});
    }

    if (ctx.pipe_stdin) {
      if (ctx.pipe_stdin.readable) {
        ctx.pipe_stdin
        .on('data', (data) => {
          if (proc.stdin.writable) {
            proc.stdin.write(data);
          }
        })
        .on('end', () => {
          proc.stdin.end();
        })
        .on('error', (err) => {
          proc.stdin.end();
          rej(err);
        })

        proc.stdin
        .on('error', (err) => {
          rej(err);
        })
      }
      else {
        proc.stdin.end();
      }
    }

    for (let io in redirs) {
      proc.stdio[io]
      .on('data', (data) => {
        for (let stream of redirs[io]) {
          if (!isNaN(stream)) {
            ctx.stdio[stream].write(data);
          };
          if (stream && stream.writable) {
            stream.write(data);
          }
        }
      })
      .on('end', () => {
        for (let stream of redirs[io]) {
          if (!isNaN(stream)) continue;
          if (stream && stream.writable) {
            stream.end();
          }
        }
      })
      .on('error', (err) => {
        for (let stream of redirs[io]) {
          if (stream && isNaN(stream)) continue;
          proc.stdio[stream].end();
        }
      })
    }

    if (ctx.pipe_stdout) {
      proc.stdout
      .on('data', (data) => {
        ctx.pipe_stdout.write(data);
      })
      .on('end', () => {
        ctx.pipe_stdout.end();
      })
      .on('error', (err) => {
        ctx.pipe_stdout.end();
        rej(err);
      })
    }

    proc
    .on('exit', (code, signal) => {
      log('exit "%s"', origName);
      if (code || signal) return rej(code || signal);
      res();
    })
    .on('error', (err) => {
      rej(err);
    })
  });
  state.restore();
}

$.group_cmd = async function (node, state, ctx)
{
  log('evaluate group_cmd');
  return await $.evaluate(node.list, state, ctx);
}

$.if_cmd = async function (node, state, ctx)
{
  log('evaluate if_cmd');
  // let exitCode = 0;

  await $.evaluate(node.if, state, ctx)
  .then(async () => {
    // try {
      await $.evaluate(node.then, state, ctx);
    // }
    // catch (err) { exitCode = err }
  })
  .catch(async (err) => {
    // try {
      await $.evaluate(node.else, state, ctx);
    // }
    // catch (err) { exitCode = err }
  })

  // if (exitCode !== 0) {
  //   throw exitCode;
  // }
}

$.subshell_cmd = async function (node, state, ctx)
{
  log('evaluate subshell_cmd');
  state.save();
  await $.evaluate(node.list, state, ctx);
  state.restore();
}

$.redir_ofile = async function (node, state, ctx)
{
  log('evaluate redir_ofile');
  const fname = await $.word(node.fname, state, ctx);
  return {type: 'file', io: node.io, stream: fs.createWriteStream(fname)};
}

$.redir_fd = async function (node, state, ctx)
{
  log('evaluate redir_fd');
  return {type: 'fd', io: node.io, to: node.to};
}

$.assign = async function (node, state, ctx)
{
  log('evaluate assign');
  const {name, value} = node;
  if (value) {
    let res = await $.word(value, state, ctx);
    process.env[name] = res;
  }
  else {
    delete process.env[name];
  }
}

$.AND = function (node, state, ctx)
{
  return 'and';
}

$.OR = function (node, state, ctx)
{
  return 'or';
}

$.word = require('./word').evaluate;
