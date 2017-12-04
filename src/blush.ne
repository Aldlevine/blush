@{%

  function one (arr) {
    return merge(arr)[0];
  }

  function merge (...args) {
    return flatten(args.map((a) => filter(flatten(a))));
  }

  function flatten ($) {
    if (!($ instanceof Array)) return [$];
    return $.reduce((a, b) => {
      return a.concat(b);
    }, []);
  }

  function filter ($) {
    if (!($ instanceof Array)) return [$];
    return $.filter((t) => t !== null && typeof t !== 'undefined');
  }

  function combine (type, tokens) {
    return tokens.reduce((tok, {value='', text=''}) => {
      tok.value += value;
      tok.text += text;
      return tok;
    }, {...tokens.shift(), type})
  }

  function string (type, start, body, end) {
    start.value = '';
    end.value = '';
    const parts = body ? [start, one(body), end] : [start, end];
    return combine(type, parts);
  }

  function loose_word (word) {
    word = merge(...word);
    if (word.length > 1) return {
      type: 'loose_word',
      parts: word,
    }
    return one(word);
  }

  const slashes = require('slashes');
  const unescape = require('unescape-js');

  function unescape_word (word) {
    return slashes.strip(
      word.replace(/\\(.)/g, '$1')
          .replace(/^(\\)$/, '\\$1')
    );
  }

  function apply_modifiers (head, rest) {
    rest = merge(...rest);
    head.modifier = rest.shift();
    const commands = [head];
    for (let i=0, ii=rest.length; i<ii; i+=2) {
      rest[i].modifier = rest[i+1];
      commands.push(rest[i]);
    }
    return commands;
}

  const moo = require('moo');

  const lexer = moo.states({
    main: {
      WS: /[ \t]+/,
      COMMENT: /#.+/,
      LESSAND: '<&',
      GREATAND: '>&',
      AND: '&&',
      BG: '&',
      CLOBBER: '>|',
      PIPEAND: '|&',
      OR: '||',
      PIPE: '|',
      DSEMI: ';;',
      SEMI: ';',
      DLESSDASH: '<<-',
      DLESS: '<<',
      DGREAT: '>>',
      LESSGREAT: '<>',
      GREAT: '>',
      BANG: '!',
      SUBSTITUTE: {match: '$(', push: 'main'},
      LPAREN: {match: '(', push: 'main'},
      RPAREN: {match: ')', pop: true},
      LJS: {match: '{%', push: 'javascript'},
      LBRACE: '{',
      RBRACE: '}',
      LMATH: '[[',
      RMATH: ']]',
      EQ: '=',
      NUMBER: /[0-9]+/,
      ASSIGN: /[a-zA-Z_][a-zA-Z0-9_]*=/,
      NAME: {
        match: /(?:[a-zA-Z_][a-zA-Z0-9_]*)(?=\s)/,
        keywords: {
          CASE: 'case',
          COPROC: 'coproc',
          DO: 'do',
          DONE: 'done',
          ELIF: 'elif',
          ELSE: 'else',
          ESAC: 'esac',
          FI: 'fi',
          FOR: 'for',
          FUNCTION: 'function',
          IF: 'if',
          IN: 'in',
          SELECT: 'select',
          THEN: 'then',
          UNTIL: 'until',
          WHILE: 'while',
          TIME: 'time',
        }
      },
      EQUO: { match: `$'`, push: 'estring' },
      DQUO: { match: `"`, push: 'dstring' },
      SQUO: { match: `'`, push: 'sstring' },
      WORD: { match: /(?:(?:\\(?:\\\\)*[\s'";|&()<>])|(?:\\\\)|[^\s'";|&()<>])+/, value: unescape_word },
      NL: { match: /\n/, lineBreaks: true },
    },
    estring: {
      ESTR: { match: /(?:(?:\\')|[^'\n])+/, value: unescape },
      SQUO: { match: `'`, pop: true }
    },
    dstring: {
      SUBSTITUTE: { match: '$(', push: 'main' },
      DSTR: { match: /(?:(?:\\")|[^"\n])+/, value: unescape },
      DQUO: { match: `"`, pop: true }
    },
    sstring: {
      SSTR: { match: /[^'\n]+/, value: unescape },
      SQUO: { match: `'`, pop: true }
    },
    javascript: {
      DQUO: { match: `"`, push: 'dstring' },
      SQUO: { match: `'`, push: 'sstring' },
      RJS: { match: '%\}', pop: true },
      JAVASCRIPT: { match: /(?:[^%"']|(?:%(?!\})))+/, lineBreaks: true},
    }
  });
%}

@lexer lexer

program      -> empty list empty
                {% ([,list,]) => ({
                  type: 'program',
                  body: list,
                }) %}
             |  empty
                {% () => ({ type: 'program', body: null }) %}

list         -> list_body _ list_term
                {% ([list,, list_term]) => {
                  const mod = one(list_term).value;
                  if (mod && mod.type == 'BG') {
                    const last = list.commands.slice(-1)[0];
                    last.bg = mod;
                  }
                  return list;
                } %}

list_body    -> list_item (_ list_sep empty list_item):*
                {% ([head, rest]) => {
                  const raw = merge(head, ...rest);
                  const commands = [];
                  for (let i=0, ii=raw.length; i<ii; i++) {
                    let mod = raw[i];
                    if (mod.type == 'list_sep') {
                      if (mod.value.type == 'AND' || mod.value.type == 'OR') {
                        raw[i+1].modifier = mod.value;
                      }
                      else if (mod.value.type == 'BG') {
                        raw[i-1].bg = mod.value;
                      }
                    }
                    else {
                      commands.push(raw[i]);
                    }
                  }
                  return {
                    type: 'list',
                    commands,
                  }
                } %}

list_sep     -> (%AND | %OR | %SEMI | %BG | %NL)
                {% ([sep]) => ({
                  type: 'list_sep',
                  value: one(sep),
                }) %}

list_term    -> (%SEMI | %BG | %NL)
                {% ([term], l) => ({
                  type: 'list_term',
                  value: one(term),
                }) %}

list_item    -> (pipeline | assign)
                {% id %}

pipeline     -> (%TIME __):? (%BANG __):? command (_ pipe_sep empty command):*
                {% ([time, bang, head, rest]) => {
                  const raw = merge(head, ...rest);
                  const commands = [];
                  for (let i=0, ii=raw.length; i<ii; i++) {
                    let token = raw[i];
                    if (token.type === 'pipe_sep') {
                      raw[i-1].pipe_stdout = true;
                      raw[i+1].pipe_stdin = true;
                      if (token.value.type === 'PIPEAND') {
                        raw[i-1].redir = raw[i-1].redir || [];
                        raw[i-1].redir.push({
                          type: 'redir_fd',
                          io: 2,
                          to: 1
                        });
                      }
                    }
                    else {
                      commands.push(raw[i]);
                    }
                  }
                  return {
                    type: 'pipeline',
                    time: !!time,
                    negate: !!bang,
                    commands,
                    modifier: null,
                    bg: null,
                  }
                } %}

pipe_sep     -> (%PIPE | %PIPEAND)
                  {% ([sep]) => ({
                    type: 'pipe_sep',
                    value: one(sep),
                  }) %}

time         -> %TIME
                  {% ([time, bang]) => ({
                    type: 'time',
                  }) %}

# TODO: Add redirects
command      -> ((redir _):+ __):? (simple_cmd | compound_cmd) (_ redir):*
                {% ([redir1, cmd, redir2]) => {
                  cmd = one(cmd);
                  cmd.pipe_stdout = null;
                  cmd.pipe_stdin = null;
                  cmd.redir = merge(...merge(redir1, redir2));
                  return cmd;
                } %}

simple_cmd   -> (assign __):* strict_word (__ loose_word):*
                {% ([assign, name, args]) => {
                  name = one(name);
                  args = merge(...args);
                  let dot = false;
                  if (/^\.\//.test(name)) {
                    dot = true;
                  }
                  return {
                    type: 'simple_cmd',
                    params: merge(assign).map((p) => (p.local = true, p)),
                    name,
                    args,
                    dot,
                  }
                } %}

compound_cmd -> (group_cmd | if_cmd | while_cmd | until_cmd | subshell_cmd)

group_cmd    -> %LBRACE empty list_body (_ list_term):? empty %RBRACE
                {% ([,,list,list_term,,]) => {
                  list = one(list);
                  list.commands.push(one(list_term));
                  list.commands = filter(list.commands);
                  return {
                    type: 'group_cmd',
                    list: one(list),
                  }
                } %}

if_cmd       -> %IF EMPTY list empty %THEN EMPTY list (empty else_part):? empty %FI
                {% ([,,If,,,,Then,Else]) => ({
                  type: 'if_cmd',
                  if: one(If),
                  then: one(Then),
                  else: one(merge(Else))
                }) %}

else_part    -> %ELIF EMPTY list empty %THEN EMPTY list (empty else_part):?
                {% ([,,If,,,,Then,Else]) => ({
                  type: 'if_cmd',
                  if: one(If),
                  then: one(Then),
                  else: one(merge(Else))
                }) %}
             |  %ELSE EMPTY list
                {% ([,,list]) => list %}

while_cmd    -> %WHILE EMPTY list empty %DO EMPTY list empty %DONE
                {% ([,,Until,,,,Do,,]) => ({
                  type: 'while_cmd',
                  until: one(Until),
                  do: one(Do),
                }) %}

until_cmd    -> %UNTIL EMPTY list empty %DO EMPTY list empty %DONE
                {% ([,,While,,,,Do,,]) => ({
                  type: 'until_cmd',
                  while: one(While),
                  do: one(Do),
                }) %}

subshell_cmd -> %LPAREN empty list_body (_ list_term):? _ %RPAREN
                {% ([,,list,list_term,,]) => {
                  list = one(list);
                  list.commands.push(one(list_term));
                  list.commands = merge(...list.commands);
                  return {
                    type: 'subshell_cmd',
                    list,
                  }
                } %}



assign       -> %ASSIGN (word):?
                {% ([assign, word]) => {
                  const name = one(assign).value.slice(0, -1);
                  return {
                    type: 'assign',
                    name,
                    value: one(word),
                  }
                } %}

loose_word   -> (strict_word | keyword_word | op_word | assign_word):+
                {% (words) => {
                  return loose_word(merge(...words));
                } %}

strict_word  -> (word):+
                {% loose_word %}

# TODO: Find a way to handle words correctly
word         -> (%NUMBER | %NAME | %WORD)
                {% (word) => combine('word', merge(...word)) %}
             |  string
                {% id %}
             |  keyword_word word
                {% (word) => combine('word', merge(...word)) %}
             |  word op_word word
                {% (word) => combine('word', merge(...word)) %}
             |  sub_word
                {% one %}
             |  js_word
                {% one %}

sub_word     -> %SUBSTITUTE empty list_body (_ list_term):? _ %RPAREN
                {% ([,,list,list_term,,]) => {
                  list = one(list);
                  list.commands.push(one(list_term));
                  list.commands = merge(...list.commands);
                  return {
                    type: 'sub_word',
                    list,
                  }
                } %}

js_word      -> %LJS empty (%JAVASCRIPT | string):* empty %RJS
                {% ([,,parts,,]) => {
                  const js_word = combine('js_word', merge(...parts));
                  js_word.value = js_word.text;
                  return js_word;
                } %}

string       -> dstr
             |  %SQUO (%SSTR):? %SQUO
                {% (str) => string('sstr', ...str) %}
             |  %EQUO (%ESTR):? %SQUO
                {% (str) => string('estr', ...str) %}

dstr         -> %DQUO (sub_word | %DSTR):* %DQUO
                {% (str) => {
                  str = flatten(str);
                  let parts = [];
                  for (let part of str) {
                    part = one(part);
                    if (part.type == 'DSTR') {
                      part.type = 'dstr_string';
                      parts.push(part);
                    }
                    if (part.type == 'sub_word') {
                      part.type = 'dstr_sub_word';
                      parts.push(part);
                    }
                  }
                  return {
                    type: 'dstr',
                    parts
                  }
                } %}

keyword_word -> keyword
                {% (word) => combine('word', merge(word)) %}

op_word      -> (%LBRACE | %RBRACE | %LMATH | %RMATH | %EQ)
                {% (op) => combine('word', merge(op)) %}

assign_word  -> (%ASSIGN)
                {% (assign) => combine('word', merge(assign)) %}

keyword      ->   %CASE   | %COPROC | %DO    | %DONE     | %ELIF | %ELSE
                | %ESAC   | %FI     | %FOR   | %FUNCTION | %IF   | %IN
                | %SELECT | %THEN   | %UNTIL | %WHILE    | %TIME

redir        -> redir_ofile | redir_fd | redir_iofile

redir_ofile  -> (%NUMBER):? %GREAT _ word
                {% ([io,,,fname]) => ({
                  type: 'redir_ofile',
                  io: one(io) ? one(io).value : 1,
                  fname: one(fname),
                }) %}

redir_iofile -> %NUMBER %LESSGREAT _ word
                {% ([io,,,fname]) => ({
                  type: 'redir_iofile',
                  io: one(io) ? one(io).value : 0,
                  fname: one(fname),
                }) %}

redir_fd     -> (%NUMBER):? %GREATAND %NUMBER
                {% ([io,,to]) => ({
                  type: 'redir_fd',
                  io: one(io) ? one(io).value : 1,
                  to: one(to).value
                }) %}

newline      -> (%NL):+
                {% id %}

empty        -> (%WS | %NL | %COMMENT):*
                {% () => null %}

EMPTY        -> (%WS | %NL | %COMMENT):+
                {% () => null %}

_            -> (%WS):*
                {% () => null %}

__           -> (%WS):+
                {% () => null %}
