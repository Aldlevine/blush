const IO = require('./io');

module.exports = class Context
{
  constructor ({
    parent,
    env = Object.assign({}, process.env),
    exports = Object.keys(env),
    cwd = process.env.PWD,
    dirstack = [cwd],
    stdio = new IO,
    filename = null,
  }={})
  {
    this.parent = parent || this;
    this.stdio = stdio;
    this._env = {'?': 0, ...env};
    this._exports = ['?', ...exports];
    this._cwd = cwd;
    this._dirstack = dirstack;
    this.filename = filename;
  }

  clone ({subshell = false, exports = []} = {})
  {
    return new Context({
      parent: subshell ? null : this,
      subshell: subshell,
      env: subshell ? this.generateExportEnv(exports) : this.env,
      exports: this.exports.slice(),
      cwd: this.cwd,
      dirstack: this.dirstack.slice(),
      stdio: this.stdio.clone(),
      filename: this.filename,
    });
  }

  generate (exports = [])
  {
    return {
      env: this.generateExportEnv(exports),
      cwd: this.cwd,
      stdio: this.stdio,
    };
  }

  generateExportEnv (exports=[])
  {
    return [...exports, ...this.exports].reduce((env, key) => {
      env[key] = key in this.env ? this.env[key] : '';
      return env;
    }, {});
  }

  get top ()
  {
    let parent = this.parent;
    while (parent !== parent.parent) {
      parent = parent.parent;
    }
    return parent;
  }

  get env () { return this._env }
  set env (val) { this._env = val }

  get exports () { return this.top._exports }
  set exports (val) { this.top._exports = val }

  get cwd () { return this.top._cwd }
  set cwd (val) { this.top._cwd = val }

  get dirstack () { return this.top._dirstack }
  set dirstack (val) { this.top._dirstack = val }

  get exitCode () { return this._env['?'] }
  set exitCode (val) { this._env['?'] = val }
  // get exitCode () { return this._exitCode }
  // set exitCode (val) { this._exitCode = val }
}
