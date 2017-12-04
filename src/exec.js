const parse = require('./parse');
const {run} = require('./run');
const Context = require('./context');
const {PassThrough} = require('stream');

module.exports = async function exec (cmd, ctx = new Context())
{
  const stdout = new PassThrough;
  let out = '';

  const origStdout = ctx.stdio[1];
  ctx.stdio[1] = stdout;

  return await new Promise(async (res, rej) => {
    // console.log(stdout);

    stdout
    .on('error', (err) => { rej(err) })
    .on('data', (data) => { out += data.toString() })
    .on('end', () => { res(out) });

    if (typeof cmd === 'string') {
      try {
        cmd = parse(cmd+'\n');
      }
      catch (err) {
        return rej(err);
      }
    }

    try {
      await run(cmd, ctx);
      ctx.stdio[1] = origStdout;
    }
    catch (err) {
      ctx.stdio[1] = origStdout;
      rej(err);
    }
  });
}
