const _path = require('path');
const path = module.exports = Object.assign({}, _path);

for (let fn of ['format', 'join', 'normalize', 'relative', 'resolve']) {
  path[fn] = (...args) => _path[fn](...args)
    .replace(/^([A-Z]):/, (_, p) => '/' + p.toLowerCase())
    .replace(/\\/g, '/');
}
