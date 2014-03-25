var snmp = require('../lib/snmp');
var mappings = require('../lib/mappings');

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
  "invalidation": 1000 * 60 * 60 * 24 * 365  // a year
});

cfg.set('collectd-mappings', {
  "snmp": {
    "if_octets": {plugin:"interface", type:"octets"},
    "disk_octets":"disk",
    "cpu_usage": {plugin:"cpu", type:"global"},
    "mem_usage": {plugin:"memory", type:"global"},
    "swap_usage": snmp.swapUsage,
    "fs_usage": snmp.fsUsage,
    "undefined": snmp.generic
  },
  "interface": mappings.unprefixer('if')
});

cfg.set('http-port', 1080);
cfg.set('authenticator', 'allow_all');

// Specific configuration per environment
cfg.env('test', function() {
  cfg.set('http-port', 21080);
});

cfg.env('openshift', function() {
  var mongodb = cfg.get('mongodb');
  mongodb['mongo-url'] = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME;
  mongodb['mongo-server-options'].poolSize = 4;

  cfg.set('http-host', process.env.OPENSHIFT_NODEJS_IP);
  cfg.set('http-port', 16000);
});

module.exports = cfg.values;
