// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }


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
      WS: /[ \t]/,
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
      LPAREN: '(',
      RPAREN: ')',
      LBRACE: '{',
      RBRACE: '}',
      LMATH: '[[',
      RMATH: ']]',
      EQ: '=',
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
      DSTR: { match: /(?:(?:\\")|[^"\n])+/, value: unescape },
      DQUO: { match: `"`, pop: true }
    },
    sstring: {
      SSTR: { match: /[^'\n]+/, value: unescape },
      SQUO: { match: `'`, pop: true }
    }
  });
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "program", "symbols": ["empty", "list", "empty"], "postprocess":  ([,list,]) => ({
          type: 'program',
          body: list,
        }) },
    {"name": "program", "symbols": ["empty"], "postprocess": () => ({ type: 'program', body: null })},
    {"name": "list", "symbols": ["list_body", "_", "list_term"], "postprocess":  ([list,, list_term]) => {
          const mod = one(list_term).value;
          if (mod && mod.type == 'BG') {
            const last = list.commands.slice(-1)[0];
            last.bg = mod;
          }
          return list;
        } },
    {"name": "list_body$ebnf$1", "symbols": []},
    {"name": "list_body$ebnf$1$subexpression$1", "symbols": ["_", "list_sep", "empty", "list_item"]},
    {"name": "list_body$ebnf$1", "symbols": ["list_body$ebnf$1", "list_body$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "list_body", "symbols": ["list_item", "list_body$ebnf$1"], "postprocess":  ([head, rest]) => {
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
        } },
    {"name": "list_sep$subexpression$1", "symbols": [(lexer.has("AND") ? {type: "AND"} : AND)]},
    {"name": "list_sep$subexpression$1", "symbols": [(lexer.has("OR") ? {type: "OR"} : OR)]},
    {"name": "list_sep$subexpression$1", "symbols": [(lexer.has("SEMI") ? {type: "SEMI"} : SEMI)]},
    {"name": "list_sep$subexpression$1", "symbols": [(lexer.has("BG") ? {type: "BG"} : BG)]},
    {"name": "list_sep$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL)]},
    {"name": "list_sep", "symbols": ["list_sep$subexpression$1"], "postprocess":  ([sep]) => ({
          type: 'list_sep',
          value: one(sep),
        }) },
    {"name": "list_term$subexpression$1", "symbols": [(lexer.has("SEMI") ? {type: "SEMI"} : SEMI)]},
    {"name": "list_term$subexpression$1", "symbols": [(lexer.has("BG") ? {type: "BG"} : BG)]},
    {"name": "list_term$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL)]},
    {"name": "list_term", "symbols": ["list_term$subexpression$1"], "postprocess":  ([term], l) => ({
          type: 'list_term',
          value: one(term),
        }) },
    {"name": "list_item", "symbols": ["pipeline"]},
    {"name": "list_item", "symbols": ["assign"], "postprocess": id},
    {"name": "pipeline$ebnf$1$subexpression$1", "symbols": [(lexer.has("TIME") ? {type: "TIME"} : TIME), "__"]},
    {"name": "pipeline$ebnf$1", "symbols": ["pipeline$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "pipeline$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "pipeline$ebnf$2$subexpression$1", "symbols": [(lexer.has("BANG") ? {type: "BANG"} : BANG), "__"]},
    {"name": "pipeline$ebnf$2", "symbols": ["pipeline$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "pipeline$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "pipeline$ebnf$3", "symbols": []},
    {"name": "pipeline$ebnf$3$subexpression$1", "symbols": ["_", "pipe_sep", "empty", "command"]},
    {"name": "pipeline$ebnf$3", "symbols": ["pipeline$ebnf$3", "pipeline$ebnf$3$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "pipeline", "symbols": ["pipeline$ebnf$1", "pipeline$ebnf$2", "command", "pipeline$ebnf$3"], "postprocess":  ([time, bang, head, rest]) => {
          const raw = merge(head, ...rest);
          const commands = [];
          for (let i=0, ii=raw.length; i<ii; i++) {
            let token = raw[i];
            if (token.type === 'pipe_sep') {
              raw[i-1].pipe_stdout = true;
              raw[i+1].pipe_stdin = true;
              if (token.value.type === 'PIPEAND') {
                raw[i-1].redir[2] = 1;
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
        } },
    {"name": "pipe_sep$subexpression$1", "symbols": [(lexer.has("PIPE") ? {type: "PIPE"} : PIPE)]},
    {"name": "pipe_sep$subexpression$1", "symbols": [(lexer.has("PIPEAND") ? {type: "PIPEAND"} : PIPEAND)]},
    {"name": "pipe_sep", "symbols": ["pipe_sep$subexpression$1"], "postprocess":  ([sep]) => ({
          type: 'pipe_sep',
          value: one(sep),
        }) },
    {"name": "time", "symbols": [(lexer.has("TIME") ? {type: "TIME"} : TIME)], "postprocess":  ([time, bang]) => ({
          type: 'time',
          // bang: !!one(bang),
        }) },
    {"name": "command$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "command$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": ["redir", "_"]},
    {"name": "command$ebnf$1$subexpression$1$ebnf$1", "symbols": ["command$ebnf$1$subexpression$1$ebnf$1", "command$ebnf$1$subexpression$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "command$ebnf$1$subexpression$1", "symbols": ["command$ebnf$1$subexpression$1$ebnf$1", "__"]},
    {"name": "command$ebnf$1", "symbols": ["command$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "command$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "command$subexpression$1", "symbols": ["simple_cmd"]},
    {"name": "command$subexpression$1", "symbols": ["compound_cmd"]},
    {"name": "command$ebnf$2", "symbols": []},
    {"name": "command$ebnf$2$subexpression$1", "symbols": ["_", "redir"]},
    {"name": "command$ebnf$2", "symbols": ["command$ebnf$2", "command$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "command", "symbols": ["command$ebnf$1", "command$subexpression$1", "command$ebnf$2"], "postprocess":  ([redir1, cmd, redir2]) => {
          cmd = one(cmd);
          cmd.pipe_stdout = null;
          cmd.pipe_stdin = null;
          cmd.redir = merge(...merge(redir1, redir2));
          return cmd;
        } },
    {"name": "simple_cmd$ebnf$1", "symbols": []},
    {"name": "simple_cmd$ebnf$1$subexpression$1", "symbols": ["assign", "__"]},
    {"name": "simple_cmd$ebnf$1", "symbols": ["simple_cmd$ebnf$1", "simple_cmd$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "simple_cmd$ebnf$2", "symbols": []},
    {"name": "simple_cmd$ebnf$2$subexpression$1", "symbols": ["__", "loose_word"]},
    {"name": "simple_cmd$ebnf$2", "symbols": ["simple_cmd$ebnf$2", "simple_cmd$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "simple_cmd", "symbols": ["simple_cmd$ebnf$1", "strict_word", "simple_cmd$ebnf$2"], "postprocess":  ([assign, name, args]) => ({
          type: 'simple_cmd',
          params: merge(assign),
          name: one(name),
          args: merge(...args),
        }) },
    {"name": "compound_cmd$subexpression$1", "symbols": ["group_cmd"]},
    {"name": "compound_cmd$subexpression$1", "symbols": ["if_cmd"]},
    {"name": "compound_cmd$subexpression$1", "symbols": ["while_cmd"]},
    {"name": "compound_cmd$subexpression$1", "symbols": ["until_cmd"]},
    {"name": "compound_cmd$subexpression$1", "symbols": ["subshell_cmd"]},
    {"name": "compound_cmd", "symbols": ["compound_cmd$subexpression$1"]},
    {"name": "group_cmd$ebnf$1$subexpression$1", "symbols": ["_", "list_term"]},
    {"name": "group_cmd$ebnf$1", "symbols": ["group_cmd$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "group_cmd$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "group_cmd", "symbols": [(lexer.has("LBRACE") ? {type: "LBRACE"} : LBRACE), "empty", "list_body", "group_cmd$ebnf$1", "empty", (lexer.has("RBRACE") ? {type: "RBRACE"} : RBRACE)], "postprocess":  ([,,list,list_term,,]) => {
          list = one(list);
          list.commands.push(one(list_term));
          list.commands = filter(list.commands);
          return {
            type: 'group_cmd',
            list: one(list),
          }
        } },
    {"name": "if_cmd$ebnf$1$subexpression$1", "symbols": ["empty", "else_part"]},
    {"name": "if_cmd$ebnf$1", "symbols": ["if_cmd$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "if_cmd$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "if_cmd", "symbols": [(lexer.has("IF") ? {type: "IF"} : IF), "EMPTY", "list", "empty", (lexer.has("THEN") ? {type: "THEN"} : THEN), "EMPTY", "list", "if_cmd$ebnf$1", "empty", (lexer.has("FI") ? {type: "FI"} : FI)], "postprocess":  ([,,If,,,,Then,Else]) => ({
          type: 'if_cmd',
          if: one(If),
          then: one(Then),
          else: one(merge(Else))
        }) },
    {"name": "else_part$ebnf$1$subexpression$1", "symbols": ["empty", "else_part"]},
    {"name": "else_part$ebnf$1", "symbols": ["else_part$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "else_part$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "else_part", "symbols": [(lexer.has("ELIF") ? {type: "ELIF"} : ELIF), "EMPTY", "list", "empty", (lexer.has("THEN") ? {type: "THEN"} : THEN), "EMPTY", "list", "else_part$ebnf$1"], "postprocess":  ([,,If,,,,Then,Else]) => ({
          type: 'if_cmd',
          if: one(If),
          then: one(Then),
          else: one(merge(Else))
        }) },
    {"name": "else_part", "symbols": [(lexer.has("ELSE") ? {type: "ELSE"} : ELSE), "EMPTY", "list"], "postprocess": ([,,list]) => list},
    {"name": "while_cmd", "symbols": [(lexer.has("WHILE") ? {type: "WHILE"} : WHILE), "EMPTY", "list", "empty", (lexer.has("DO") ? {type: "DO"} : DO), "EMPTY", "list", "empty", (lexer.has("DONE") ? {type: "DONE"} : DONE)], "postprocess":  ([,,Until,,,,Do,,]) => ({
          type: 'while_cmd',
          until: one(Until),
          do: one(Do),
        }) },
    {"name": "until_cmd", "symbols": [(lexer.has("UNTIL") ? {type: "UNTIL"} : UNTIL), "EMPTY", "list", "empty", (lexer.has("DO") ? {type: "DO"} : DO), "EMPTY", "list", "empty", (lexer.has("DONE") ? {type: "DONE"} : DONE)], "postprocess":  ([,,While,,,,Do,,]) => ({
          type: 'until_cmd',
          while: one(While),
          do: one(Do),
        }) },
    {"name": "subshell_cmd$ebnf$1$subexpression$1", "symbols": ["_", "list_term"]},
    {"name": "subshell_cmd$ebnf$1", "symbols": ["subshell_cmd$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "subshell_cmd$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "subshell_cmd", "symbols": [(lexer.has("LPAREN") ? {type: "LPAREN"} : LPAREN), "empty", "list_body", "subshell_cmd$ebnf$1", "_", (lexer.has("RPAREN") ? {type: "RPAREN"} : RPAREN)], "postprocess":  ([,,list,list_term,,]) => {
          list = one(list);
          list.commands.push(one(list_term));
          return {
            type: 'subshell_cmd',
            list,
          }
        } },
    {"name": "assign$ebnf$1", "symbols": []},
    {"name": "assign$ebnf$1$subexpression$1", "symbols": ["word"]},
    {"name": "assign$ebnf$1", "symbols": ["assign$ebnf$1", "assign$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "assign", "symbols": [(lexer.has("ASSIGN") ? {type: "ASSIGN"} : ASSIGN), "assign$ebnf$1"], "postprocess":  ([assign, word]) => {
          const name = one(assign).value.slice(0, -1);
          return {
            type: 'assign',
            name,
            value: one(word),
          }
        } },
    {"name": "loose_word$ebnf$1$subexpression$1", "symbols": ["strict_word"]},
    {"name": "loose_word$ebnf$1$subexpression$1", "symbols": ["keyword_word"]},
    {"name": "loose_word$ebnf$1$subexpression$1", "symbols": ["op_word"]},
    {"name": "loose_word$ebnf$1$subexpression$1", "symbols": ["assign_word"]},
    {"name": "loose_word$ebnf$1", "symbols": ["loose_word$ebnf$1$subexpression$1"]},
    {"name": "loose_word$ebnf$1$subexpression$2", "symbols": ["strict_word"]},
    {"name": "loose_word$ebnf$1$subexpression$2", "symbols": ["keyword_word"]},
    {"name": "loose_word$ebnf$1$subexpression$2", "symbols": ["op_word"]},
    {"name": "loose_word$ebnf$1$subexpression$2", "symbols": ["assign_word"]},
    {"name": "loose_word$ebnf$1", "symbols": ["loose_word$ebnf$1", "loose_word$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "loose_word", "symbols": ["loose_word$ebnf$1"], "postprocess":  (words) => {
          return loose_word(merge(...words));
        } },
    {"name": "strict_word$ebnf$1$subexpression$1", "symbols": ["word"]},
    {"name": "strict_word$ebnf$1", "symbols": ["strict_word$ebnf$1$subexpression$1"]},
    {"name": "strict_word$ebnf$1$subexpression$2", "symbols": ["word"]},
    {"name": "strict_word$ebnf$1", "symbols": ["strict_word$ebnf$1", "strict_word$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "strict_word", "symbols": ["strict_word$ebnf$1"], "postprocess": loose_word},
    {"name": "word$subexpression$1", "symbols": [(lexer.has("NAME") ? {type: "NAME"} : NAME)]},
    {"name": "word$subexpression$1", "symbols": [(lexer.has("WORD") ? {type: "WORD"} : WORD)]},
    {"name": "word", "symbols": ["word$subexpression$1"], "postprocess": (word) => combine('word', merge(...word))},
    {"name": "word", "symbols": ["string"], "postprocess": id},
    {"name": "word", "symbols": ["keyword_word", "word"], "postprocess": (word) => combine('word', merge(...word))},
    {"name": "word", "symbols": ["word", "op_word", "word"], "postprocess": (word) => combine('word', merge(...word))},
    {"name": "string$ebnf$1$subexpression$1", "symbols": [(lexer.has("DSTR") ? {type: "DSTR"} : DSTR)]},
    {"name": "string$ebnf$1", "symbols": ["string$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "string$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "string", "symbols": [(lexer.has("DQUO") ? {type: "DQUO"} : DQUO), "string$ebnf$1", (lexer.has("DQUO") ? {type: "DQUO"} : DQUO)], "postprocess": (str) => string('dstr', ...str)},
    {"name": "string$ebnf$2$subexpression$1", "symbols": [(lexer.has("SSTR") ? {type: "SSTR"} : SSTR)]},
    {"name": "string$ebnf$2", "symbols": ["string$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "string$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "string", "symbols": [(lexer.has("SQUO") ? {type: "SQUO"} : SQUO), "string$ebnf$2", (lexer.has("SQUO") ? {type: "SQUO"} : SQUO)], "postprocess": (str) => string('sstr', ...str)},
    {"name": "string$ebnf$3$subexpression$1", "symbols": [(lexer.has("ESTR") ? {type: "ESTR"} : ESTR)]},
    {"name": "string$ebnf$3", "symbols": ["string$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "string$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "string", "symbols": [(lexer.has("EQUO") ? {type: "EQUO"} : EQUO), "string$ebnf$3", (lexer.has("SQUO") ? {type: "SQUO"} : SQUO)], "postprocess": (str) => string('estr', ...str)},
    {"name": "keyword_word", "symbols": ["keyword"], "postprocess": (word) => combine('word', merge(word))},
    {"name": "op_word$subexpression$1", "symbols": [(lexer.has("LBRACE") ? {type: "LBRACE"} : LBRACE)]},
    {"name": "op_word$subexpression$1", "symbols": [(lexer.has("RBRACE") ? {type: "RBRACE"} : RBRACE)]},
    {"name": "op_word$subexpression$1", "symbols": [(lexer.has("LMATH") ? {type: "LMATH"} : LMATH)]},
    {"name": "op_word$subexpression$1", "symbols": [(lexer.has("RMATH") ? {type: "RMATH"} : RMATH)]},
    {"name": "op_word$subexpression$1", "symbols": [(lexer.has("EQ") ? {type: "EQ"} : EQ)]},
    {"name": "op_word", "symbols": ["op_word$subexpression$1"], "postprocess": (op) => combine('word', merge(op))},
    {"name": "assign_word$subexpression$1", "symbols": [(lexer.has("ASSIGN") ? {type: "ASSIGN"} : ASSIGN)]},
    {"name": "assign_word", "symbols": ["assign_word$subexpression$1"], "postprocess": (assign) => combine('word', merge(assign))},
    {"name": "keyword", "symbols": [(lexer.has("CASE") ? {type: "CASE"} : CASE)]},
    {"name": "keyword", "symbols": [(lexer.has("COPROC") ? {type: "COPROC"} : COPROC)]},
    {"name": "keyword", "symbols": [(lexer.has("DO") ? {type: "DO"} : DO)]},
    {"name": "keyword", "symbols": [(lexer.has("DONE") ? {type: "DONE"} : DONE)]},
    {"name": "keyword", "symbols": [(lexer.has("ELIF") ? {type: "ELIF"} : ELIF)]},
    {"name": "keyword", "symbols": [(lexer.has("ELSE") ? {type: "ELSE"} : ELSE)]},
    {"name": "keyword", "symbols": [(lexer.has("ESAC") ? {type: "ESAC"} : ESAC)]},
    {"name": "keyword", "symbols": [(lexer.has("FI") ? {type: "FI"} : FI)]},
    {"name": "keyword", "symbols": [(lexer.has("FOR") ? {type: "FOR"} : FOR)]},
    {"name": "keyword", "symbols": [(lexer.has("FUNCTION") ? {type: "FUNCTION"} : FUNCTION)]},
    {"name": "keyword", "symbols": [(lexer.has("IF") ? {type: "IF"} : IF)]},
    {"name": "keyword", "symbols": [(lexer.has("IN") ? {type: "IN"} : IN)]},
    {"name": "keyword", "symbols": [(lexer.has("SELECT") ? {type: "SELECT"} : SELECT)]},
    {"name": "keyword", "symbols": [(lexer.has("THEN") ? {type: "THEN"} : THEN)]},
    {"name": "keyword", "symbols": [(lexer.has("UNTIL") ? {type: "UNTIL"} : UNTIL)]},
    {"name": "keyword", "symbols": [(lexer.has("WHILE") ? {type: "WHILE"} : WHILE)]},
    {"name": "keyword", "symbols": [(lexer.has("TIME") ? {type: "TIME"} : TIME)]},
    {"name": "redir", "symbols": ["redir_ofile"]},
    {"name": "redir_ofile", "symbols": [(lexer.has("GREAT") ? {type: "GREAT"} : GREAT), "_", "word"], "postprocess":  ([,,fname]) => ({
          type: 'redir_ofile',
          io: 1,
          fname: one(fname),
        }) },
    {"name": "newline$ebnf$1", "symbols": []},
    {"name": "newline$ebnf$1$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL)]},
    {"name": "newline$ebnf$1", "symbols": ["newline$ebnf$1", "newline$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "newline", "symbols": ["newline$ebnf$1"], "postprocess": id},
    {"name": "EMPTY$ebnf$1$subexpression$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "EMPTY$ebnf$1$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL)]},
    {"name": "EMPTY$ebnf$1$subexpression$1", "symbols": [(lexer.has("COMMENT") ? {type: "COMMENT"} : COMMENT)]},
    {"name": "EMPTY$ebnf$1", "symbols": ["EMPTY$ebnf$1$subexpression$1"]},
    {"name": "EMPTY$ebnf$1$subexpression$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "EMPTY$ebnf$1$subexpression$2", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL)]},
    {"name": "EMPTY$ebnf$1$subexpression$2", "symbols": [(lexer.has("COMMENT") ? {type: "COMMENT"} : COMMENT)]},
    {"name": "EMPTY$ebnf$1", "symbols": ["EMPTY$ebnf$1", "EMPTY$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "EMPTY", "symbols": ["EMPTY$ebnf$1"], "postprocess": () => null},
    {"name": "empty$ebnf$1", "symbols": []},
    {"name": "empty$ebnf$1$subexpression$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "empty$ebnf$1$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL)]},
    {"name": "empty$ebnf$1$subexpression$1", "symbols": [(lexer.has("COMMENT") ? {type: "COMMENT"} : COMMENT)]},
    {"name": "empty$ebnf$1", "symbols": ["empty$ebnf$1", "empty$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "empty", "symbols": ["empty$ebnf$1"], "postprocess": () => null},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "_$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => null},
    {"name": "__$ebnf$1$subexpression$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1$subexpression$1"]},
    {"name": "__$ebnf$1$subexpression$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "__$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": () => null}
]
  , ParserStart: "program"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
