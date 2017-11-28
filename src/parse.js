const fs = require('fs');
const {inspect} = require('util');
const nearley = require('nearley');
const grammar = require('../dist/grammar');
const log = require('./utils/debug')('blush:parse');


const parse = module.exports = function parse (src)
{
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  const ast = parser.feed(src).finish();

  log('%O', ast);

  if (ast.length == 0) {
    return null;
  }

  if (ast.length > 1) {
    log('WARNING: ambiguity detected.')
  }

  return ast[0];
}

module.exports.file = function parseFile (file)
{
  const src = fs.readFileSync(file, 'utf-8');
  return parse(src);
}

