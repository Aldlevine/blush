const os = require('os');

module.exports = function parseExitCode (err)
{
  if (!isNaN(err)) { return err }
  else if (typeof err === 'string') {
    const code = os.constants.signals[err] + 128;
    return code;
  }
  else if (err.errno) {
    let code = err.errno;
    if (typeof code === 'string') { code = os.constants.errno[code] }
    return code;
  }
  return -1;
}
