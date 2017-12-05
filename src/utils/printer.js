const IO = require('../io');
const log = require('./debug')('blush:print');
const errno = require('errno');

module.exports = class Printer
{
  constructor ({
    stdio = new IO,
    formatOut = Printer.formatOut,
    formatErr = Printer.formatErr,
  }={})
  {
    this.stdio = stdio;
    this.formatOut = formatOut;
    this.formatErr = formatErr;
  }

  out (...args)
  {
    stdio[1].write(this.formatOut(...args));
  }

  err (...args)
  {
    stdio[2].write(this.formatErr(...args));
  }

  static out ({
    stdio = new IO,
    formatOut = Printer.formatOut,
  } = {}, ...args)
  {
    stdio[1].write(formatOut(...args));
  }

  static err ({
    stdio = new IO,
    formatErr = Printer.formatErr,
  } = {}, ...args)
  {
    stdio[2].write(formatErr(...args));
  }

  static formatOut (...args)
  {
    return args.map((value) => {
      if (value && typeof value === 'object') { return JSON.stringify(value, null, 2) }
      return value;
    }).join('\n')+'\n';
  }

  static formatErr (...args)
  {
    return args
    .filter((value) => !(value && typeof value === 'object' && value.wasPrinted))
    .map((value) => {
      if (value && typeof value === 'object') { value.wasPrinted = true };

      if (value instanceof Error) {
        let message = value.message;

        if (value.syscall) message = Printer.formatSystemError(value);

        return `blush:${value.source ? ' '+value.source+':' : ''} ${message}\n`;
      }

      if (typeof value === 'string') { return `blush: ${arg}` }
    }).join('\n');
  }

  static formatSystemError (err)
  {
    let msg;
    switch (err.code) {
      case 'E2BIG':
        msg = 'argument list too long'; break;
      default:
        msg = errno.code[err.code].description; break;
    }
    if (err.path) { msg = err.path + ': ' + msg }
    return msg;
  }
}
