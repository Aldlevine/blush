const IO = require('../io');
const EventEmitter = require('events');
const {PassThrough} = require('stream');

module.exports = class Builtin extends EventEmitter
{
  constructor (name, args, ctx)
  {
    super();
    Object.assign(this, {
      cwd: process.cwd(),
      env: process.env,
      stdio: new IO,
    }, ctx.clone());

    this.stdin = this.stdio[0] =
    this.stdio[0] == 'pipe' ? new PassThrough() : this.stdio[0];

    this.stdout = this.stdio[1] =
    this.stdio[1] == 'pipe' ? new PassThrough() : this.stdio[1];

    this.stderr = this.stdio[2] =
    this.stdio[2] == 'pipe' ? new PassThrough() : this.stdio[2];

    setTimeout(() => this.exit(1), 0);
  }

  exit (result)
  {
    this.stdout && !this.stdout.isTTY && this.stdout.end();
    this.stderr && !this.stderr.isTTY && this.stderr.end();
    process.nextTick(() => this.emit('exit', result));
  }

  error (err)
  {
    this.stdout && !this.stdout.isTTY && this.stdout.end();
    this.stderr && !this.stderr.isTTY && this.stderr.end();
    process.nextTick(() => this.emit('error', err));
  }
}
