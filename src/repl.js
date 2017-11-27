const parse = require('./parse');
const parseExitCode = require('./utils/parse-exit-code');
const {evaluate} = require('./eval');
const glob = require('glob');
const readline = require('readline')
const path = require('path');
const log = require('./debug')('blush:repl');
const chalk = require('chalk');
const os = require('os');

const REPL = module.exports = class REPL
{
  constructor ()
  {
    this.history = [];
    this.status = 0;
    this.rl = null;

    process.on('SIGINT', () => {});

    readline.emitKeypressEvents(process.stdin);

    process.stdin.on('keypress', (code) => {
      const line = this.rl.line;
      if (code === '\u0004') {
        if (line.length == 0) {
          this.rl.clearLine(process.stdin, -1);
          this.rl.close();
        }
        else {
          this.rl._tabComplete(true);
        }
      }
    });
  }

  renderPrompt ()
  {
    return this.status == 0
    ? chalk`{green [0]}{gray [${process.cwd()}]$} `
    : chalk`{red [${this.status}]}{gray [${process.cwd()}]$} `;
  }

  setPrompt ()
  {
    this.rl.setPrompt(this.renderPrompt());
  }

  async start ()
  {
    this.startReadline();

    // TODO: Do something more elegant to load dotfiles.
    await this.evaluate('source ~/.blushrc; source .blushrc; echo -n');
  }

  startReadline ()
  {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.completer,
      prompt: this.renderPrompt(),
    })

    this.rl.history = this.history;

    this.rl.prompt();

    this.rl
    .on('line', async (line) => {
      try {
        await this.evaluate(line, () => {});
      }
      catch (err) {}
      this.rl.prompt();
    })
    .on('close', () => {
    })
    .on('SIGINT', async () => {
      this.rl.clearLine(process.stdin, -1);
      this.rl.prompt();
    });
  }

  stopReadline ()
  {
    this.history = this.rl.history;
    this.rl.close();
  }

  async evaluate (cmd)
  {
    let ast;

    try {
      ast = parse(cmd+'\n');
    }
    catch (err) {
      this.rl.setPrompt(chalk`{red [1]}{gray [${process.cwd()}]$} `);
      console.error(err.message);
      return;
    }

    // ast = [];
    if (!ast) {
      console.error('invalid syntax:\n\nUnexpected end of input\n')
      this.status = 1;
      return this.setPrompt();
    }

    log('stop');
    this.stopReadline();

    return evaluate(ast)
    .then(() => {
      // try
      this.status = 0;
    }, (err) => {
      // catch
      if ((this.status = parseExitCode(err)) == -1) {
        console.error(err);
      }
    })
    .then(() => {
      // finally
      log('resume');
      this.startReadline();
    })
  }

  handleError (err)
  {
    // exit code
    if (!isNaN(err)) {
    }
    // signal
    else if (typeof err === 'string') {
    }
    // error
    else if (err && err instanceof Error) {
      switch (err.errno) {
        case 'ECONNRESET':
        case 'EPIPE':
          break;
        case 'ENOENT':
          console.error('blush: command not found:', err.path);
          break;
        default:
          console.error(err.message);
      }
    }
  }

  /** Lame completer */
  completer (line, callback)
  {
    const paths = process.env.PATH.split(path.delimiter);
    let idx = 0;
    let res = [];
    const found = paths.map((p) => {
      glob(path.join(p,line+'*'), (err, files) => {
        if (!err) {
          res.push(...files.map((f) => path.basename(f)));
        }
        if (++idx == paths.length) {
          callback(null, [res, line]);
        }
      });
    });
  }
};
