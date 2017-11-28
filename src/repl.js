const exec = require('./exec');
const parse = require('./parse');
const parseExitCode = require('./utils/parse-exit-code');
const {evaluate} = require('./eval');
const glob = require('glob');
const readline = require('readline')
const path = require('path');
const log = require('./utils/debug')('blush:repl');
const chalk = require('chalk').constructor({level: 2});
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

  async renderPrompt ()
  {

    let cwd = (await exec('pwd -L || cd'))
    .replace(/\n/g, '')
    .replace(RegExp('^'+os.homedir()), '~')
    .replace(/(?!^)(\/|\\)/g, chalk`{dim.bgHex('#555')   }`)
    .replace(/^\//, chalk`{bgHex('#555') / }{dim.bgHex('#555')  }`);

    // let branch = (await exec('git rev-parse --abbrev-ref HEAD || echo'))
    // .replace(/\n/g, '');
    let branch = '';
    if (branch.length) branch = ' @ '+branch;

    let name = chalk`{bold.white.bgHex('#169')  blush }{hex('#169').bgHex('#555') }`;

    return this.status == 0
    ? chalk`{bold.hex('#160').bgHex('#be0')  0 }{hex('#be0').bgHex('#169') }${name}{bgHex('#555')  ${cwd} ${branch}}{hex('#555') } `
    : chalk`{bold.white.bgHex('#700')  ${this.status} }{hex('#700').bgHex('#169') }${name}{bgHex('#555')  ${cwd} ${branch}}{hex('#555') } `;
  }

  async setPrompt ()
  {
    this.rl.setPrompt(await this.renderPrompt());
  }

  async start ()
  {
    await this.startReadline();

    // TODO: Do something more elegant to load dotfiles.
    await this.evaluate('source ~/.blushrc; source .blushrc; echo -n');
  }

  async startReadline ()
  {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.completer,
      prompt: await this.renderPrompt(),
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
      this.status = 1;
      await this.setPrompt();
      console.error(err.message);
      return;
    }

    if (!ast) {
      console.error('blush: invalid syntax:\n\nUnexpected end of input\n')
      this.status = 1;
      return await this.setPrompt();
    }

    if (!ast.body) return;

    log('stop');
    this.stopReadline();

    return evaluate(ast)
    .then(() => {
      // try
      this.status = 0;
    }, (err) => {
      // catch
      log(err);
      if (isNaN(err)) {
        console.error('blush:', err.message || err);
      }
      this.status = parseExitCode(err);
    })
    .then(async () => {
      // finally
      log('resume');
      await this.startReadline();
    })
  }

  /** Lame completer */
  completer (line, callback)
  {
    if (/\s*\.\//.test(line)) {
      // search cwd
      glob(line+'*', (err, files) => {
        if (err) return callback(err);
        callback(null, [files, line]);
      });
    }
    else {
      // search path
      const paths = process.env.PATH.split(path.delimiter);
      let idx = 0;
      let res = [];
      const found = paths.map((p) => {
        glob(path.join(p,line+'*'), (err, files) => {
          if (err) return callback(err);

          res.push(...files.map((f) => path.basename(f)));
          if (++idx == paths.length) {
            callback(null, [res, line]);
          }
        });
      });
    }
  }
};
