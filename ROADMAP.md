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


### Enhancements

- [ ] Normalize error handling / reporting
- [ ] Normalize io redirection and piping


### Core

- [ ] Complete implementation of subshell
- [ ] Complete redirection syntax / evaluation
- [ ] Complete implementation of all keywords / control operator
- [ ] Support core bash arguments
- [ ] Support applicable bash style env variables
- [ ] Implement core builtins
  - [x] alias
  - [x] cd
  - [x] exit
  - [x] source
  - [x] which
  - [ ] pushd
  - [ ] popd
  - ...
