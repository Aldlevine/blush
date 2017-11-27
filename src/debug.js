const debug = module.exports = require('debug');

debug.formatters.e = (err) => err.stack;

