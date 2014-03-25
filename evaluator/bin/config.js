var cfg = require('cfg').createConfig();

cfg.set('mongodb', {
  'mongo-host': '127.0.0.1',
  'mongo-port': 27017,
  'mongo-database': 'cube',
  'mongo-username': null,
  'mongo-password': null,
  'mongo-server-options': {
    auto_reconnect: true,
    poolSize: 8,
    socketOptions: {
      noDelay: true
    }
  },

  'mongo-metrics': {
    autoIndexId: true,
    capped: false,
    safe: false
  },

  'mongo-events': {
    autoIndexId: true,
    capped: false,
    safe: false
  },

  'separate-events-database': true,
  'separate-metrics-database': true,

  'authentication-collection': 'users'
});

cfg.set('horizons', {
  "calculation": 1000 * 60 * 60 * 24 * 31 * 12 // 1 year
});

cfg.set('http-port', 1081);
cfg.set('authenticator', 'allow_all');

cfg.env('test', function() {
  cfg.set('http-port', 21081);
});

cfg.env('openshift', function() {
  var mongodb = cfg.get('mongodb');
  mongodb['mongo-url'] = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME;
  mongodb['mongo-server-options'].poolSize = 4;

  cfg.set('http-host', process.env.OPENSHIFT_NODEJS_IP);
  cfg.set('http-port', 15000);
});

module.exports = cfg.values;
