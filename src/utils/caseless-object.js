function upper (val)
{
  if (typeof val === 'string' || val instanceof String) {
    return val.toUpperCase();
  }
  return val;
}

module.exports = function caseless (obj)
{
  obj = Object.entries(obj).reduce((acc, [key, val]) =>
  (acc[upper(key)] = val, acc), {});

  return new Proxy(obj, {
    get (obj, key) { return obj[upper(key)] },
    set (obj, key, val) { return obj[upper(key)] = val }
  })
}
