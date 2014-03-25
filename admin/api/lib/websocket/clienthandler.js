var _          = require('lodash'),
  async        = require('async'),
  WebSocket    = require('./websocket'),
  Logger       = require('../logger'),
  logger       = new Logger(module),
  cfg          = require('../config.js'),
  evaluator    = cfg.get('evaluator')
  EE           = require('events').EventEmitter
;

function ClientHandler(client) {
  this.client = client;
  this.sockets = [];
  this.datas = {};
  this.push = _.throttle(this._push , 100);
  this.forward_metric = forward.bind(this, evaluator.metric.url);
  this.forward_event = forward.bind(this, evaluator.event.url);
  _.bindAll(this);
}

ClientHandler.prototype.setup = function() {
  var self = this;

  self.logger = logger.user(self.client.handshake.user.username);

  // Handle incoming connection
  self.client.on('*', function (name, data) {
    if (/^requestmetric-\d+/.test(name)) {
      return self.forward_metric(name.substring(14), data);
    }
    if (/^requestevent-\d+/.test(name)) {
      return self.forward_event(name.substring(13), data);
    }
    if (/^unrequestmetric-\d+/.test(name)) {
      return self.unsubscribe(name.substring(16));
    }
    if (/^unrequestevent-\d+/.test(name)) {
      return self.unsubscribe(name.substring(15));
    }
  });
  self.client.once('disconnect', self.clientDisconnected);
}

ClientHandler.prototype.clientDisconnected = function() {
  this.sockets.forEach(function(socket) {
    socket.removeAllListeners();
    socket.disconnect();
  });
}

ClientHandler.prototype.unsubscribe = function(id) {
  var socket = _.findWhere(this.sockets, { id: id });
  if (!socket) {
    return console.error('Tried to unsubscribe from an unknown socket', id);
  }
  socket.removeAllListeners();
  socket.disconnect();
}

function forward(server, id, msg) {
  var self = this,
      ws = new WebSocket({
        id: id,
        server: server,
        query: msg,
        logger: self.logger
      });

  ws.once('formulaError', function (err) {
    self.client.emit('data-' + id, JSON.stringify(err));
  });
  ws.once('close', function () {
    self.client.disconnect();
  });
  ws.once('connect', function(query) {
    ws.on('data', self.reply.bind(self, id));
    self.sockets.push(ws);
  });
}

/**
 * Browse through all the requested channels to send the results found so far.
 */
ClientHandler.prototype._push = function() {
  _.forEach(this.datas, function(values, key) {
    if (values.length) {
      this.client.emit('data-' + key, '[' + values.splice(0).join(',') + ']');
    }
  }, this);
}

/**
 * Event fired when cube provides data.
 * @param  {String} id   ID associated with the data to push.
 * @param  {Object} data Response from cube.
 */
ClientHandler.prototype.reply = function(id, data) {
  if (!this.datas[id]) {
    this.datas[id] = [];
  }
  this.datas[id].push(data);
  this.push();
}

module.exports = ClientHandler;
