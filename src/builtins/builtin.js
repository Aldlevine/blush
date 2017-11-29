const EventEmitter = require('events');
const {PassThrough} = require('stream');

module.exports = class Builtin extends EventEmitter
{
  constructor (name, args, opts, state)
  {
    super();
    Object.assign(this, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['pipe','pipe','pipe']
    }, opts);

    this.stdio[0] = this.stdin = this.stdio[0] == 'pipe' ?
      new PassThrough() : null;

    this.stdio[1] = this.stdout = this.stdio[1] == 'pipe' ?
      new PassThrough() : null;

    this.stdio[2] = this.stderr = this.stdio[2] == 'pipe' ?
      new PassThrough() : null;

    this._stdin = this.stdin || process.stdin;
    this._stdout = this.stdout || process.stdout;
    this._stderr = this.stderr || process.stderr;

    this.on('exit', () => {
      this.stdin && this.stdin.end();
      this.stdout && this.stdout.end();
      this.stderr && this.stderr.end();
    });
  }
}
