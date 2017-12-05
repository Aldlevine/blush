#!/usr/bin/env blush

# // vim: set ft=:
# // vim: set syn=javascript:

status="$?";

cwd="$(pwd)";
branch="$(2>/dev/null git rev-parse --abbrev-ref HEAD)"

echo {%

const chalk = require('chalk').constructor({level: 3});

const home = '$HOME';

let cwd = '$cwd'
  .replace(/\n/g, '')
  .replace(RegExp(home), '~')
  .replace(/(\/|\\)([^\/\\]+)$/g, chalk`{dim.bgHex('#555')   }{white.bold.bgHex('#555') $2}`)
  .replace(/(?!^)(\/|\\)/g, chalk`{dim.bgHex('#555')   }`)
  .replace(/^\//, chalk`{bgHex('#555') / }{dim.bgHex('#555')  }`);

let branch = '$branch';
branch = branch.length ? chalk`{dim.bgHex('#555') } {bold.blue  $branch }` : '';

const res = '$status' == 0
? chalk`{bold.hex('#160').bgHex('#be0')  0 }{hex('#be0').bgHex('#555') }{bgHex('#555') ${ branch } ${ cwd } }{hex('#555') } `
: chalk`{bold.white.bgHex('#700')  ${ $status } }{hex('#700').bgHex('#555') }{bgHex('#555') ${ branch } ${ cwd } }{hex('#555') } `;

res;

%};
