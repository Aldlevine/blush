### Features

- [ ] Support plugins
- [ ] Run javascript directly using node's `vm` module
  - [ ] as a shell script
  - [x] as a javascript subshell
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


### Questionable enhancements

- [ ] Simplify grammar by utilizing states more cleanly


### Fixes

- [ ] Pipe should still make it lo `less` in this example: `ls | {true && less;}`
- [ ] ~~Fix word escaping (some sequences, like `\a` aren't handled)~~
- [ ] Make escaping follow bash rules instead of zsh rules.
- [ ] Enable escaping of `$` character to prevent substitution
- [ ] Make subshell substitution work with assignments


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
