module.exports = function print (...args)
{
  console.log(...args);
}

module.exports.err = function err (...args)
{
  for (let arg of args) {
    if (arg instanceof Error) {
      console.error('blush:', arg.message);
    }
    else if (typeof arg === 'string') {
      console.error('blush:', arg);
    }
    else if (isNaN(arg)) {
      console.error(arg.message);
    }
  }
}
