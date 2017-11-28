const parse = require('./parse');
const {evaluate} = require('./eval');
const {PassThrough} = require('stream');

module.exports = async function exec (cmd)
{
  const pipe_stdout = new PassThrough;
  let out = '';
  return await new Promise((res, rej) => {
    pipe_stdout
    .on('error', (err) => {
      rej(err);
    })
    .on('data', (data) => {
      out += data.toString();
    })
    .on('end', () => {
      res(out)
    });

    try {
      evaluate(parse(cmd+'\n'), {pipe_stdout});
    }
    catch (err) {
      rej(err);
    }
  });
}
