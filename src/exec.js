const parse = require('./parse');
const {run} = require('./run');
const State = require('./state');
const {PassThrough} = require('stream');

module.exports = async function exec (cmd, state=new State, ctx={})
{
  const pipe_stdout = new PassThrough;
  let out = '';

  return new Promise(async (res, rej) => {
    pipe_stdout
    .on('error', (err) => {
      rej(err);
    })
    .on('data', (data) => {
      out += data.toString();
    })
    .on('end', () => {
      res(out);
    });

    if (typeof cmd === 'string') {
      cmd = parse(cmd+'\n');
    }

    try {
      await run(cmd, state, {pipe_stdout});
    }
    catch (err) {
      rej(err);
    }
  });
}
