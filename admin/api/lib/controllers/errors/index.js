var ClientError = require('../../models/error')
  , Logger        = require('../../logger')
  , logger        = new Logger(module)
  ;

function remoteAddress(req) {
  return req.socket && (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress));
}

function persistError (error, host, user) {
  process.nextTick(function() {
    var e = new ClientError({
      d: {
        host: host,
        user: user,
        error: error
      }
    })
    logger.user(user).error('encountered a browser error')
    e.save(function (err) {
      if(err) {
        return logger.error('Unable to create error', err)
      }
    })
  })
}

module.exports = {
  create: function (req, res, next) {
    var body = req.body, error

    if(!body || !(error = body.e)) { return next() }

    try { error = JSON.parse(error) } catch (e) { return next() }

    if(!Array.isArray(error)) { return next() }

    persistError(error, remoteAddress(req), req.isAuthenticated() ? req.user.username : null)

    res.end();
  }
}
