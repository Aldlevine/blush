const fs = require('fs');

module.exports = async function readShebang (path)
{
  return await new Promise((res, rej) => {
    const rs = fs.createReadStream(path, {encoding: 'utf8'});
    let acc = '';
    let pos = 0;
    let isShebang = true;
    let index;
    rs
    .on('data', function (chunk) {
      index = chunk.indexOf('\n');
      acc += chunk;
      if (!/\s*(#!)?/.test(acc)) { rs.close(); return; }
      index !== -1 ? rs.close() : pos += chunk.length;
    })
    .on('close', function () {
      let result = acc.slice(0, pos + index).trim();
      if (/^#!/.test(result)) { return res(result.slice(2)) }
      res(null);
    })
    .on('error', function (err) {
      rej(err);
    })
  });
}
