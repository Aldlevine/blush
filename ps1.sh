#!/usr/bin/env blush

# // vim: set ft=:
# // vim: set syn=javascript:

status="$?";

cwd="$(pwd)";
uname="$(whoami)"
branch="$(git rev-parse --abbrev-ref HEAD |& cat || echo)"

echo {%

const chalk = new require('chalk').constructor({level: 3});

const home = '$HOME';
let cwd = '$cwd'
.replace(/\n/g, '')
.replace(RegExp(home), '~')
.replace(/(\/|\\)([^\/\\]+)$/g, chalk`{dim.bgHex('#555')   }{white.bold.bgHex('#555')  $2 }`)
.replace(/(?!^)(\/|\\)/g, chalk`{dim.bgHex('#555')   }`)
.replace(/^\//, chalk`{bgHex('#555') / }{dim.bgHex('#555')  }`);

let uname = '$uname';
let branch = '$branch';


uname = chalk`{bold.white.bgHex('#169')  $uname }{hex('#169').bgHex('#555') }`;

branch = branch.replace(/^fatal:.+$/, '');
branch = branch.length ? chalk`{dim.bgHex('#555')  } {bold.blue  $branch}` : '';

return '$status' == 0
? chalk`{bold.hex('#160').bgHex('#be0')  0 }{hex('#be0').bgHex('#169') }${ uname }{bgHex('#555')  ${ cwd }${ branch } }{hex('#555') } `
: chalk`{bold.white.bgHex('#700')  ${ $status } }{hex('#700').bgHex('#169') }${ uname }{bgHex('#555')  ${ cwd }${ branch } }{hex('#555') } `;

%};

