let idx = 0;

module.exports = class State
{
  constructor ({
    env = process.env,
    dirstack = [process.cwd()]
  }={})
  {
    this.env = env;
    this.dirstack = dirstack;

    this.savedStates = [];
  }

  save ()
  {
    this.env = process.env;
    this.savedStates.push({
      env: Object.assign({}, this.env),
      dirstack: this.dirstack.slice(),
    })
  }

  restore ()
  {
    const {env, dirstack} = this.savedStates.pop();
    process.env = this.env = env;
    this.dirstack = dirstack;
  }
}
