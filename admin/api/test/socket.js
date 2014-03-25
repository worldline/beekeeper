/*global describe: true, after: true, before: true, it: true, afterEach: true*/
var mocha         = require('mocha'),
  should          = require('should'),
  api             = require('../'),
  cfg             = require('../lib/config'),
  apiConfig       = cfg.get('api'),
  io              = require('socket.io-client'),
  fs              = require('fs'),
  spawn           = require('child_process').spawn,
  cube            = require('cube'),
  WS              = require('ws'),
  mongodb         = require('mongodb'),
  request         = require('request').defaults({ json: true }),
  async           = require('async'),
  portfinder      = require('portfinder'),
  User            = require('../lib/models/user'),
  dropDatabase    = require('./utils/dropDatabase');

var ports = {}, servers = [];

var socketApi = 'http://localhost:' + apiConfig.port,
  cubeLauncher = function (type) {
    return function (done) {
      portfinder.getPort(function (err, port) {
        if (err) { return done(err); }
        ports[type] = port;
        var config = require('cube/bin/' + type + '-config');
        var mongo = config.mongodb;
        mongo['mongo-host'] = '127.0.0.1';
        mongo['mongo-port'] = 27017;
        mongo['mongo-database'] = 'cube_test';
        mongo['separate-events-database'] = false;
        mongo['separate-metrics-database'] = false;
        config['http-port'] = port;
        config.horizons.invalidation = Number.MAX_VALUE;
        config.horizons.calculation = Number.MAX_VALUE;

        var server = cube.server(config);
        servers.push(server);
        server.use(cube[type].register).start(done);
      });
    }
  };

function removeTestCubeCollections(done) {
  var client = new mongodb.Db('cube_test', new mongodb.Server('127.0.0.1', 27017, {}));
  function dropCollection(collection) {
    return function (callback) {
      client.dropCollection(collection, function (err) {
        if (!err || err.errmsg === 'ns not found') { return callback() }
        callback(err);
      })
    }
  }
  async.series({
    openConnection: function (callback) { client.open(callback) },
    dropEvents: dropCollection('test_websocket_events'),
    dropMetrics: dropCollection('test_websocket_metrics'),
    closeConnection: function (callback) { client.close(true, callback) }
  }, done)
}

describe('Socket', function() {
  // Launch cube elements
  before(cubeLauncher('collector'))
  before(cubeLauncher('evaluator'))

  // Clean collections
  before(removeTestCubeCollections)
  after(removeTestCubeCollections)

  // Launch API server
  before(function startApi(done) {
    var evalCfg = cfg.get('evaluator');
    evalCfg.metric.url = 'ws://localhost:' + ports['evaluator'] + '/1.0/metric/get';
    evalCfg.event.url =  'ws://localhost:' + ports['evaluator'] + '/1.0/event/get';
    api.start(function() {
      var socket = new WS('ws://localhost:' + ports['collector'] + '/1.0/event/put');
      socket.once('open', function() {
        socket.send(JSON.stringify({
          type: 'test_websocket',
          time: 'Sun, 09 Jul 1972 11:30:00 GMT',
          data: {value: 1331}
        }), function() { socket.terminate(); done(); });
      });
    });
  })
  after(function (done) {
    api.stop(function() {
      function stop(server, callback) {
        server.stop(callback);
      }
      async.each(servers, stop, done);
    });
  })

  // Authentication handling
  before(function(done) {
    dropDatabase(User, function(err) {
      if (err) { return done(err) }
      User.create(JSON.parse(fs.readFileSync('./test/fixtures/users.json')), done);
    })
  })
  after(function (done) { dropDatabase(User, done); })

  // Prepare authentication for socket.io to pass handshake
  var http, originalRequest;
  before(function preAuth (done) {
    var jar = require('request').jar();
    request.post({
      url:  socketApi + '/user/login',
      json: { username: 'test', password: 't3st' },
      jar: jar
    }, function (err) {
      if (err) { return done(err); }

      // Monkey patch http request for socket.io handshake
      http = require('http');
      originalRequest = http.request;
      jar.getCookieString(socketApi, function (err, cookie) {
        http.request = function(options, callback) {
          options.headers.cookie = cookie;
          return originalRequest.call(http, options, callback);
        }
        done();
      });
    });
  })
  after(function () {
    // Remove monkey patching
    if (http && originalRequest) {
      http.request = originalRequest;
    }
  })

  describe('socket connection from client', function() {
    before(function(done) {
      this.defaultQuery = function() {
        return {
          expression: 'sum(test_websocket(value))',
          start: '1972-05-31T11:40:50.000Z',
          stop: '1972-05-31T11:45:50.000Z',
          step: '3600000'
        };
      }
      this.socket = io.connect(socketApi, {
        reconnect: false
      });
      this.socket.once('connect', function() { done(); });
    })

    after(function (done) {
      this.socket.once('disconnect', function() { done(); });
      this.socket.disconnect();
    })

    afterEach(function () {
      this.socket.removeAllListeners('data');
    })

    it('Should require data and get expected value', function (done) {
      var messages = [] , expected = 2;

      this.socket.on('data-1', function(data) {
        messages.push.apply(messages, JSON.parse(data));
        if (messages.length > expected) { return should.fail('Callback called too many times'); }

        if (messages.length === expected) {
          request.get('http://localhost:' + ports['evaluator'] + '/1.0/metric/get?expression=sum(test_websocket(value))&step=300000&start=1972-07-09T11%3A30%3A00.000Z&stop=1972-07-09T11%3A35%3A00.000Z', function(err, res) {
            should.not.exist(err);
            var restData = res.body[0];
            restData.should.have.ownProperty("time");
            restData.time.should.equal("1972-07-09T11:30:00.000Z");
            restData.value.should.eql(1331);
            messages[0].should.eql(restData)
            messages[1].should.have.ownProperty("time");
            messages[1].time.should.equal("1972-07-09T11:35:00.000Z");
            should.strictEqual(messages[1].value, null);
            done();
          });
        }
      });

      this.socket.emit('requestmetric-1', JSON.stringify({
        expression: 'sum(test_websocket(value))',
        start: '1972-07-09T11:30:00.000Z',
        stop: '1972-07-09T11:35:00.000Z',
        step: '300000'
      }));
    });

    it('Should require json with no expression parameter and get an error', function (done) {
      var query = this.defaultQuery();
      delete query.expression;

      this.socket.once('data-2', function(data) {
        data = JSON.parse(data);
        data.length.should.eql(1);
        data[0].should.have.ownProperty("error");
        data[0].error.should.equal("Bad Selection, please check your formula's expression");
        done();
      })

      this.socket.emit('requestmetric-2', JSON.stringify(query))
    });

    it('Should require json with no stop parameter and get last hour data', function (done) {
      var query = this.defaultQuery(), messages = [], expected = 1;
      delete query.stop;
      query.start = new Date();
      query.start.setHours(query.start.getHours()-1);

      this.socket.on('data-3', function(data) {
        messages.push.apply(messages, JSON.parse(data));

        if (messages.length > expected) { return should.fail('Callback called too many times') }

        if (messages.length === expected) {
          var hourTier = new Date((Math.floor(Date.now() / 3600000) * 3600000)-3600000).toISOString()
          messages[0].should.have.ownProperty('time');
          messages[0].should.have.ownProperty('value');
          messages[0].time.should.eql(hourTier);
          messages[0].value.should.eql(0);
          done();
        }
      })

      this.socket.emit('requestmetric-3', JSON.stringify(query))
    });
  });
});
