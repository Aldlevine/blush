module.exports = class BlushError extends Error
{
  constructor (message, errno)
  {
    super(message);
    this.errno = errno;
  }
}
