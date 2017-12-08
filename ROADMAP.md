### Features

- [ ] Support plugins
- [ ] Run javascript directly using node's `vm` module
  - [ ] as a shell script
  - [x] as a javascript subshell
  - [ ] ~~Shouldn't be done as substitution, but as it's own command.~~
- [ ] Expose API to hosted scripts
- [ ] Support custom prompt
- [ ] Support custom readline
- [ ] Support custom completer
  - [ ] Rendering
  - [ ] Choices
  - [ ] Choice classes
    - _Use parser as a completion engine?_
- [ ] Modal keymaps
  - [ ] Ability to steal input from readline


### Enhancements

- [x] Normalize error handling / reporting
- [x] Normalize io redirection and piping
- [ ] Cleanup env / export process
- [ ] Normalize subshell execution
- [ ] Handle `cd`/`pushd`/`popd` manually (when using relative paths)
- [ ] ~~Include `pwd` builtin that uses the dirstack instead to the system's pwd~~
- [x] Combine command context and state
- [ ] Syntax highlighting
- [ ] Move all parse errors to the parse module. (Add recoverable flag to handle
  unexpected end of input errors)
- [ ] Need a better syntax / approach for running js. The current approach is
  rather ugly and not idiomatic (though it is effective). Should it use the
  code's stdout as the value as opposed to the 'return' value?


### Questionable enhancements

- [ ] Simplify grammar by utilizing states more cleanly


### Fixes

- [ ] Reevaluate builtin approach to better take advantage of asynchronicity.
- [ ] Come up with a way to prevent stdio streams from getting stuck to dead
  processes (particularly JS subs and builtins). This is needed to prevent blush
  from exiting abruptly.
- [ ] Normalize all paths to POSIX style paths
- [ ] On Windoze, env vars are case insensitive, but this is intended to provide
  a POSIXish environment. Need to come up with some way to normalize env vars.
  Perhaps well-known vars can be recased.
- [ ] PATH env var should be updated to use POSIX delimiter on Windoze.
- [ ] Pipe should still make it lo `less` in this example: `ls | {true && less;}`
- [ ] ~~Fix word escaping (some sequences, like `\a` aren't handled)~~
- [ ] Make escaping follow bash rules instead of zsh rules.
- [ ] Enable escaping of `$` character to prevent substitution
- [x] Make subshell substitution work with assignments
- [ ] Exports don't work with assignments
- [ ] Don't crash on bad file descriptors


### Core

- [x] Complete implementation of subshell
- [ ] Complete redirection syntax / evaluation
  - [x] Basic output file redirection
  - [ ] Basic input file redirection
  - [ ] Output file append redirection
  - [ ] Clobber / No clobber
  - [x] Pipe and (`|&`)
  - [x] Fd output redirection
  - [ ] Fd input redirection
- [ ] Complete implementation of all keywords / control operators
- [ ] Support core bash arguments
- [ ] Support applicable bash style env variables
- [ ] Implement core builtins
  - [x] alias
  - [x] cd _Needs work_
  - [x] dirs
  - [x] pushd
  - [x] popd
  - [x] exit
  - [x] source
  - [x] which
  - [x] export
  - [x] eval
  - [ ] exec
  - ...
