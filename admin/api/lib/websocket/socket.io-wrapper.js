var cfg         = require('../config.js'),
  io            = require('socket.io'),
  WebSocket     = require('ws'),
  async         = require('async'),
  security      = require('../controllers/security'),
  evaluator     = cfg.get('evaluator'),
  socketIoCfg   = cfg.get('api')['socket.io'],
  ClientHandler = require('./clienthandler');

module.exports = {
  configure: function(server) {
    // Patch socket.io sockets so that we can have catch-all.
    io.Socket.prototype.$emit = function wildcardEmit() {
      EE.prototype.emit.apply(this, arguments);
      EE.prototype.emit.apply(this, ['*'].concat(Array.prototype.slice.call(arguments)));
    }

    var socket = io.listen(server, {
      log: socketIoCfg.log  === undefined ? true : socketIoCfg.log
    });

    function optimize() {
      socket.enable('browser client minification');
      socket.enable('browser client etag');
      socket.enable('browser client gzip');
    }

    socket.configure('qualification', optimize);
    socket.configure('production', optimize);
    socket.configure('openshift', optimize);
    socket.configure(function() {
      socket.set('authorization', security.authWS);
      socket.set('transports', socketIoCfg.transports);
      socket.set('log level', socketIoCfg.level);
    });

    socket.on('connection', function (client) {
      var handler = new ClientHandler(client);
      handler.setup();
    });
  }
}
