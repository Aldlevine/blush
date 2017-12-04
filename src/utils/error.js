module.exports = class BlushError extends Error
{
  constructor (message, errno)
  {
    super(message);

    if (!isNaN(errno)) { this.errno = errno }
    else { Object.assign(this, errno) }
  }
}
