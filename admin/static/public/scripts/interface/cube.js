define(['backbone', 'jquery', 'underscore', 'socket.io', 'config', 'logger'], function (Backbone, $, _, io, config, logger) {
  var api = config.wsUrl,
    unloading = false,
    ioOptions = _.extend({
      'max reconnection attempts': Infinity,
      'connect timeout': 5000
    }, config.ioOptions);

  $(window).on('beforeunload', function () {
    unloading = true;
    Object.keys(io.sockets).forEach(function (key) {
      var socket = io.sockets[key];
      socket.options.reconnect = false;
      socket.disconnect();
    });
  });

  function CubeConnection(options) {
    this.buffer = [];
    this.socket = null;
    this.parentId = options.id;
    this.formulas = options.formulas;
    this.callback = options.callback;
    this.subscriptions = [];
    _.bindAll(this, '_sendRequest', '_onDisconnect', '_onError', '_bufferData');
  }

  CubeConnection.prototype.connect = function () {
    var socket = this.socket = io.connect(api, ioOptions);

    socket.on('connect', this._sendRequest);

    socket.on('error', logger);
    socket.on('error', this._onError);

    socket.on('disconnect', this._onDisconnect);

    if (socket.socket.connected) {
      this._sendRequest();
    }
  };

  CubeConnection.prototype.unsubscribe = function() {
    _.each(this.subscriptions, function(subscription) {
      this.socket.emit('un' + subscription);
    }, this);
  };

  CubeConnection.prototype._onError = function (err) {
    var socket = this.socket;
    if (unloading) {
      return;
    }
    socket.disconnect();
    if (err === 'handshake error') {
      socket.socket.reconnect();
    }
  };

  CubeConnection.prototype._onDisconnect = function () {
    var socket = this.socket;
    if (unloading) {
      return; // The page is unloading, it's ok to let it go.
    }
    if (!socket.socket.reconnecting) {
      // Wait for 2s before trying a reconnection, the evaluator may not be available
      setTimeout(function () {
        if (socket.socket.reconnecting) {
          return; // Safety measure to avoid race conditions on multiple reconnections
        }
        socket.socket.reconnect();
      }, 2000);
    }
  };

  CubeConnection.prototype._sendRequest = function () {
    this.formulas.forEach(this._makeRequest, this);
  };

  CubeConnection.prototype._makeRequest = function (options) {
    if (!options) return;

    var identifier = _.uniqueId();
    var request = {
      expression: options.expression
    };

    if (options.id) {
      request.id = options.id;
    }

    if ('limit' in options) {
      request.limit = Math.max(options.limit, 2);
    }
    if ('start' in options) {
      request.start = options.start;
    }
    if ('stop' in options) {
      request.stop = options.stop;
    }
    if ('step' in options) {
      request.step = options.step;
    }

    if (!request.start && request.step && request.limit) {
      request.start = new Date(new Date() - request.step*request.limit);
    }

    var subscription = 'request' + options.kind + '-' + identifier;
    this.subscriptions.push(subscription);
    this.socket.on('data-' + identifier, this._bufferData);
    this.socket.emit(subscription, JSON.stringify(request));
  };

  CubeConnection.prototype._processData = function (data) {
    if (!data.id) {
      // No id is considered abnormal since we should send one each time.
      return;
    }

    if (data.error) {
      Backbone.trigger('widget:' + this.parentId +':data-error', data);
    }

    var current = {
      name: data.id.name,
      position: data.id.position,
      time: Date.parse(data.time),
      value: data.value != null ? data.value : data.data, //if null or undefined
      group: data.group,
      type: data.id.type
    };

    if (current.time) {
      this.callback(current);
    }
  };

  CubeConnection.prototype._bufferData = function (data) {
    if (!data) {
      // TODO handle errors
      return console.warn('Could not get data', data);
    }

    // The data is a stringified array of objects
    data = JSON.parse(data);

    _.defer(function(context) {
      data.forEach(context._processData, context);
    }, this);
  };

  return CubeConnection;
});
