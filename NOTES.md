# Execution context

Every command is provided with a copy of a shared context. In normal
circumstances the context is inherited directly from the parent. Compound
commands also inherit the parent context and pass it to their children; the
passed in context becomes the default context of the compound command, but each
child command can still be executed with an augmented context.

A context can be augmented for individual commands. This can be done by placing
assignments before the command call, or redirects before/after the command call
(or using a `|&` which implies `2>&1`).

# Redirection

Redirection is a way to make a command's io fds point to different places. This
is handled by duplicating and replacing streams in the context's stdio array.
This is normally done through altering the copied context, prior to execution,
but it can also be done by altering the current context through using the shell
builtin `exec`.

```
   Parent       Duplicate      Child
┌────────────┐              ┌────────────┐
│  dirstack >┼──────────────┼> dirstack  │
│       env >┼──────────────┼> env       │
│     stdio >┼─────┐  ┌─────┼> stdio     │
└────────────┘     │  │     └────────────┘
               ┌───│──┼───┐
               │   v  ^   │
               │ Redirect │
               │          │
               └──────────┘
```

# Env vars

Env vars are passed into a command through the parent command's context.
However, the commands don't normally read and write env vars directly to this
context. They must use the shell builtin `export` to commit these vars to the
context in order to pass them to child commands.

```
   Parent       Duplicate      Child
┌────────────┐              ┌────────────┐
│  dirstack >┼──────────────┼> dirstack  │
│     stdio >┼──────────────┼> stdio     │
│       env >┼─────┐  ┌─────┼> env       │
└────────────┘     │  │     └────────────┘
               ┌───│──┼───┐
               │   v  ^   │
               │  Assign  │
               │          │
               └──────────┘
```

# Pipes

Pipes are executed with the help of a pipeline routine. The pipeline executes
each piped command in in reverse order. Each command except for the first (the
last in reverse order) is executed with a callback used to provide the pipeline
with the process's stdin stream. This stdin stream is then passed to the
outputting command upon execution. The pipeline then waits for all processes
within the pipeline to complete before exiting. When a command has both
redirections and pipes specified, the piping is processed before the
redirection.
