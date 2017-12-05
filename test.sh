#!/usr/bin/env blush

# // vim: set ft=:
# // vim: set syn=javascript:

{%
  let name = '$NAME';
  let [fname, lname] = name.split(' ');
  console.error('First name:', fname);
  console.log('Last name:', lname);

%} | column -t -s ':' -o ':'
