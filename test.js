const fs = require('fs');
const {inspect} = require('util');
const nearley = require('nearley');
const grammar = require('./dist/grammar');

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

const src = fs.readFileSync('test.sh', 'utf-8');
ast = parser.feed(src).finish();

if (ast.length > 1) {
  console.log('WARNING: ambiguity detected.')
}

console.log(inspect(ast, {colors: true, depth: 100, breakLength: 120}));
