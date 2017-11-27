const $ = exports;
const locateCommand = require('./utils/locate-command');
const parseExitCode = require('./utils/parse-exit-code');
const builtins = require('./builtins');
const log = require('./debug')('blush:eval');
const {PassThrough} = require('stream');
const {spawn} = require('child_process');
const fs = require('fs');

$.evaluate = async function (node, ctx={})
{
  if (node instanceof Array) {
    for (let node of node) {
      await $.evaluate(node);
    }
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
      await $.evaluate(cmd, cmd_ctx);
      exitCode = 0;
    }
    catch (err) {
      log('command errored');
      exitCode = err;
      // throw err;
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

$.pipeline = async function (node, ctx)
{
  log('evaluate pipeline');

  const promises = [];
  const {commands, time, negate} = node;
  const {pipe_stdin, pipe_stdout, redir} = ctx;

  let exitCode = 0;
  let stream = null;

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
    else cmd_ctx.pipe_stdout = stream = new PassThrough;

    cmd_ctx.redir = redir;

    promises.push($.evaluate(cmd, cmd_ctx));
  }

  try {
    await Promise.all(promises);
    if (negate) {
      exitCode = 1;
    }
  }
  catch (err) {
    if (negate) {
      exitCode = 0;
    }
    else {
      exitCode = parseExitCode(err);
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
    console.log(`${time.toFixed(2)}${unit}`);
  }

  if (exitCode !== 0) {
    throw exitCode;
  }
}

/**
 * TODO: restore stdin if not consumed
 */
$.simple_cmd = async function (node, ctx)
{
  let name = $.word(node.name);
  let args = node.args.map($.word);

  log('evaluate simple_cmd "%s"', name);

  const stdio = [0,1,2];

  if (ctx.pipe_stdin) {
    log('pipe into "%s"', name);
    stdio[0] = 'pipe';
  }

  if (ctx.pipe_stdout) {
    log('pipe out of "%s"', name);
    stdio[1] = 'pipe';
  }

  const redirs = {};
  for (let r of node.redir) {
    const {io, stream} = await $.evaluate(r);
    stdio[io] = 'pipe';
    redirs[io] = redirs[io] || [];
    redirs[io].push(stream);
  }

  await new Promise((res, rej) => {
    let proc;
    let alias = builtins.alias.getAlias(name);
    if (alias) {
      let [aliasName, ...aliasArgs] = alias.split(' ');
      name = aliasName;
      args = [...aliasArgs, ...args];
    }
    if (name in builtins) {
      proc = new builtins[name](name, args, {stdio});
    }
    else {
      const cmdpath = locateCommand(name);
      if (!cmdpath) {
        process.stderr.write(`blush: command not found: ${name}\n`);
        return rej(127);
      }
      proc = spawn(cmdpath, args, {stdio});
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
          stream.write(data);
        }
      })
      .on('end', () => {
        for (let stream of redirs[io]) {
          stream.end();
        }
      });
      // proc.stdio[io].pipe(redirs[io]);
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
        rej(err);
      })
    }

    proc
    .on('exit', (code, signal) => {
      log('exit "%s"', name);
      if (code || signal) return rej(code || signal);
      res();
    })
    .on('error', (err) => {
      rej(err);
    })
  });

  log('evaluate simple_cmd');
}

$.group_cmd = async function (node, ctx)
{
  return await $.evaluate(node.list, ctx);
}

$.redir_ofile = async function (node, ctx)
{
  const fname = $.word(node.fname);
  return {io: node.io, stream: fs.createWriteStream(fname)};
}

$.assign = async function (node, ctx)
{
  const {name, value} = node;
  if (value) {
    process.env[name] = $.word(value);
  }
  else {
    delete process.env[name];
  }
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
