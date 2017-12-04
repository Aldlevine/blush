const BlushError = require('./utils/error');
const fs = require('fs');
const {Duplex} = require('stream');

class ReadWriteStream extends Duplex
{
  constructor (path, opts)
  {
    super();
    this._readStream = fs.createReadStream(path, opts);
    this._writeStream = fs.createWriteStream(path, opts);
    this.fd = opts.fd;
  }

  _write (...args)
  {
    this._writeStream._write(...args);
  }

  _read (...args)
  {
    this._readStream._read(...args);
  }

  close ()
  {
    this._writeStream.end();
  }
}

module.exports = class IO extends Array
{
  constructor (...args)
  {
    const [
      stdin = process.stdin,
      stdout = process.stdout,
      stderr = process.stderr,
      ...rest
    ] = args;
    super(stdin, stdout, stderr, ...rest);
  }

  pause ()
  {
    process.stdin.pause();
    process.stdout.pause();
    process.stderr.pause();
  }

  resume ()
  {
    process.stdin.resume();
    process.stdout.resume();
    process.stderr.resume();
  }

  reset ()
  {
    for (let i=0, ii=this.length; i<ii; i++) {
      this.close(i)
    }
    this.length = 3;
    this[0] = process.stdin;
    this[1] = process.stdout;
    this[2] = process.stderr;
  }

  clone ()
  {
    return new IO(...this);
  }

  _open (path, fd, flags)
  {
    if (typeof path !== 'string') {
      throw new TypeError('path must be a string');
    }
    if (isNaN(fd) || fd < 0) {
      throw new TypeError('fd must be an integer > 0');
    }
    this.close(fd);
    return fs.openSync(path, flags);
  }

  openReadWrite (path, fd)
  {
    try {
      this[fd] = new ReadWriteStream('', {fd: this._open(path, fd, 'r+')});
    }
    catch (err) {
      if (err.code === 'ENOENT') {
        this[fd] = new ReadWriteStream('', {fd: this._open(path, fd, 'w+')});
      }
      else {
        throw err;
      }
    }
    return this[fd];
  }

  openTrunc (path, fd)
  {
    return this[fd] = fs.createWriteStream('', {fd: this._open(path, fd, 'w+')});
  }

  openAppend (path, fd)
  {
    return this[fd] = fs.createWriteStream('', {fd: this._open(path, fd, 'a+')});
  }

  openRead (path, fd)
  {
    return this[fd] = fs.createReadStream('', {fd: this._open(path, fd, 'r')});
  }

  openWrite (path, fd)
  {
    return this[fd] = fs.createWriteStream('', {fd: this._open(path, fd, 'w')});
  }

  close (fd)
  {
    if (!this[fd] || this[fd].isTTY) return;
    try { fs.closeSync(this[fd].fd) }
    catch (e) {}
  }

  redir (from, to)
  {
    if (!this[to]) {
      throw new BlushError(`${to}: bad file descriptor`, 1);
    }
    this.close(from);
    this[from] = this[to];
    // Object.defineProperty(this, from, {
    //   get: () => this[to],
    //   set: (v) => this[to] = v,
    //   configurable: true,
    // });
  }
}
