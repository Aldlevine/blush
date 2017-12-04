const Builtin = require('./builtin');
const BlushError = require('../utils/error');
const path = require('path').posix;
const fs = require('fs');
const os = require('os');

function checkdir (ctx, pathname)
{
  const dir = path.resolve(ctx.cwd, pathname);

  try {
    const stat = fs.statSync(dir);

    if (!stat.isDirectory()) {
      return new BlushError('not a directory', {errno: 1, path: pathname});
    }
  }
  catch (err) {
    err.errno = 1;
    err.path = pathname;
    return err;
  }
}

module.exports.dirs = class Dirs extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    const homedir = os.homedir();

    const opts = {
      clear: false,
      long: false,
      lines: false,
      index: false,
    };

    const pushdirs = [];

    for (let arg of args) {
      switch (arg) {
        case '-c': opts.clear = true; break;
        case '-l': opts.long = true; break;
        case '-p': opts.lines = true; break;
        case '-v': opts.index = true; break;
        default: pushdirs.push(arg); break;
      }
    }

    if (opts.clear) { ctx.dirstack = [ctx.dirstack[0]] }

    let result = ctx.dirstack.map((dir, i) => {
      if (!opts.long) dir = dir.replace(homedir, '~');
      if (opts.index) dir = i+'\t'+dir;
      return dir;
    });

    if (opts.lines || opts.index) { result = result.join('\n') }
    else { result = result.join(' ') }
    this.stdout.write(result+'\n');

    this.exit(0);
  }
}

module.exports.pushd = class Pushd extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    const homedir = os.homedir();

    let pushdir = null;
    let rotate = 0;
    let error = null;

    for (let arg of args) {
      if (!pushdir && !rotate && /^(-|\+)\d+$/.test(arg)) { rotate = +arg }
      else if (!pushdir && !rotate) { pushdir = arg }
      else { error = new BlushError('too many arguments', {errno: 1, source: 'pushd'}) }
    }

    if (error) { this.error(error) }
    else {
      if (rotate) {
        if (rotate < 0) { rotate = ctx.dirstack.length + rotate }
        ctx.dirstack = [...ctx.dirstack.slice(rotate), ...ctx.dirstack.slice(0, rotate)];
      }
      else if (pushdir) {
        if (error = checkdir(ctx, pushdir)) { error.source = 'pushd' }
        else { ctx.dirstack.unshift(path.resolve(ctx.cwd, pushdir)) }
      }
      else if (ctx.dirstack.length > 1) {
        let tmp = ctx.dirstack[0];
        ctx.dirstack[0] = ctx.dirstack[1];
        ctx.dirstack[1] = tmp;
      }

      if (error) { this.error(error) }
      else {
        ctx.cwd = ctx.dirstack[0];
        this.stdout.write(ctx.dirstack.map((dir) => dir.replace(homedir, '~')).join(' ')+'\n');
        this.exit(0);
      }
    }

  }
}

module.exports.popd = class Pushd extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    const homedir = os.homedir();

    let idx = 0;
    let error = null;

    for (let arg of args) {
      if (!idx && /^(-|\+)\d+$/.test(arg)) { idx = +arg }
      else { error = new BlushError('too many arguments', {errno: 1, source: 'popd'}) }
    }

    if (error) { this.error(error) }
    else {
      idx = idx >= 0 ? idx : ctx.dirstack.length + idx;
      if (Object.is(idx, -0)) idx = ctx.dirstack.length - 1;
      ctx.dirstack.splice(idx, 1);
      ctx.cwd = ctx.dirstack[0];
      this.stdout.write(ctx.dirstack.map((dir) => dir.replace(homedir, '~')).join(' ')+'\n');
      this.exit(0);
    }

  }
}

module.exports.cd = class Cd extends Builtin
{
  constructor (name, args, ctx)
  {
    super(name, args, ctx);

    if (args.length == 0) { args = [os.homedir()] }

    const pathname = args.join(' ');
    const dir = path.resolve(ctx.cwd, pathname);
    let error = null;

    if (error = checkdir(ctx, pathname)) {
      error.source = 'cd';
      this.error(error);
    }
    else {
      ctx.cwd = dir;
      ctx.dirstack[0] = dir;
      this.exit(0);
    }
  }
}
