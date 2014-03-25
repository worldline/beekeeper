var WS = require('ws'),
  EventEmitter = require('events').EventEmitter,
  Logger       = require('../logger'),
  logger       = new Logger(module),
  parseFormula = require('./formulaparser')
;

function WebSocket(options) {
  var self = this;
  self.id = options.id;

  process.nextTick(function() {
    parseFormula(options.query, function (err, msg) {
      if (err) {
        options.logger.error(msg, err);
        return self.emit('formulaError', [{
          error: "Bad Selection, please check your formula's expression",
          details: err,
          id: msg.id
        }]);
      }

      if(/\.childOf/.test(options.query)) {
        options.logger.debug('Translated <'+options.query+'> into <'+ msg.expression+'>');
      }

      function disconnect() {
        socket.removeAllListeners();
        socket.close();
        self.emit('close');
      }

      var socket = new WS(options.server);
      socket.once('open', function() {
        socket.on('message', self.emit.bind(self, 'data'));
        socket.send(JSON.stringify(msg), function onErr (err) {
          if (err) {
            options.logger.error('Could not send ', msg, ' to cube server:', err);
            return self.emit('formulaError', [{
              error: 'An error happened while sending <' + msg.expression + '>to the server, you may want to retry later',
              details: err,
              id: msg.id
            }]);
          }

          self.disconnect = disconnect;
          self.emit('connect', msg);
        });
      });

      socket.once('error', function (err) {
        logger.error('WebSocket error:', err);
        disconnect();
      });

      socket.once('close', disconnect);
    });
  });
}
require('util').inherits(WebSocket, EventEmitter);

module.exports = WebSocket;
