### Features

- [ ] Support plugins
- [ ] Run javascript directly using node's `vm` module
  - [ ] as a shell script
  - [ ] as a javascript subshell
  - _builtin?_
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
- [ ] Normalize io redirection and piping
- [ ] Normalize subshell execution
- [ ] Handle `cd`/`pushd`/`popd` manually (when using relative paths)
- [ ] Include `pwd` builtin that uses the dirstack instead to the system's pwd
- [ ] Combine command context and state
- [ ] Syntax highlighting


### Questionable enhancements

- [ ] Simplify grammar by utilizing states more cleanly


### Fixes

- [ ] Fix word escaping (some sequences, like `\a` aren't handled)
- [ ] Make subshell substitution work with assignments


### Core

- [x] Complete implementation of subshell
- [x] Isolate state of scripts (like a subshell)
  - Scripts should be required to `export` env vars
- [ ] Complete redirection syntax / evaluation
  - [x] Basic file redirection
  - [x] Pipe and (`|&`)
  - [ ] Fd redirection
- [ ] Complete implementation of all keywords / control operators
- [ ] Support core bash arguments
- [ ] Support applicable bash style env variables
- [ ] Implement core builtins
  - [x] alias
  - [x] cd
  - [x] exit
  - [x] source
  - [x] which
  - [x] export
  - [ ] pushd
  - [ ] popd
  - ...
