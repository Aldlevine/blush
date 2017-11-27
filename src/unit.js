class Unit
{
  constructor ()
  {}
}

class Command extends Unit
{
  constructor ({
    pipe_stdin = false,
    pipe_stdout = false,
    redir = [],
    ...ctx,
  })
  {
    super(ctx);
    this.pipe_stdin = pipe_stdin;
    this.pipe_stdout = pipe_stdout;
    this.redir = redir;
  }
}

class SimpleCommand extends Command
{
  constructor ({
    name,
    args = [],
    params = {},
    ...ctx,
  })
  {
    super(ctx);
    this.name = name;
    this.args = args;
    this.params = params;
  }
}

class GroupCommand extends GroupCommand
{
  constructor ({
    commands = [],
    ...ctx
  })
  {
    super(ctx);
    this.commands = commands;
  }
}

class Pipeline extends Unit
{
  constructor ({
    commands = [],
    ...ctx,
  })
  {
    super(ctx);
    this.commands = commands;
  }
}
