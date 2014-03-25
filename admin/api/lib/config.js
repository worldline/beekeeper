var cfg = module.exports = require('cfg').createConfig()
, path = require('path')

// Common configuration
cfg.set('api', {
  port: 8080,
  host: '0.0.0.0',
  'socket.io': {
    log: false,
    level: 3,
    transports: ['websocket', 'xhr-polling']
  }
});

cfg.set('apikey', {
  noApiKeyAllowed: true // indicates if collector can be accessed without apikey
});

cfg.set('evaluator', {
  metric: {
    url: 'ws://localhost:1081/1.0/metric/get'
  },
  event: {
    url: 'ws://localhost:1081/1.0/event/get'
  }
});

cfg.set('cube', {
  "mongo-host": process.env.OPENSHIFT_MONGODB_DB_HOST || "127.0.0.1",
  "mongo-port": +(process.env.OPENSHIFT_MONGODB_DB_PORT || 27017),
  "mongo-database": process.env.OPENSHIFT_APP_NAME || "cube",
  "mongo-username": process.env.OPENSHIFT_MONGODB_DB_USERNAME,
  "mongo-password": process.env.OPENSHIFT_MONGODB_DB_PASSWORD,
});

cfg.set('hierarchy', {
  db: {
    host: 'localhost',
    port: 27017,
    database: 'beekeeper-hierarchy',
    options: {
      server: {
        auto_reconnect: true,
        poolSize: 5
      },
      db: {
        native_parser: true
      }
    },
    collections: {
      nodes: {
        name: 'nodes'
      }
    }
  }
});

cfg.set('dashboards', {
  db: {
    host: 'localhost',
    port: 27017,
    database: 'beekeeper-dashboards',
    options: {
      server: {
        auto_reconnect: true,
        poolSize: 5
      },
      db: {
        native_parser: true
      }
    },
    collections: {
      dashboards: {
        name: 'dashboards',
        safe: true
      }
    }
  }
});

cfg.set('security', {
  db: {
    host: 'localhost',
    port: 27017,
    database: 'beekeeper-security',
    options: {
      server: {
        auto_reconnect: true,
        poolSize: 5
      },
      db: {
        native_parser: true
      }
    },
    collections: {
      users: {
        name: 'users'
      },
      sessions: {
        name: 'sessions'
      }
    }
  },
  hashType: 'sha256',
  digestType: 'hex',
  secret: '%b33k33p3r$'
});

cfg.set('logs', {
  db: {
    host: 'localhost',
    port: 27017,
    database: 'beekeeper-logs',
    options: {
      server: {
        auto_reconnect: true,
        poolSize: 5
      },
      db: {
        native_parser: true
      }
    },
    collections: {
      logs: {
        name: 'logs'
      }
    }
  },
  failover: path.join(__dirname, '..', 'logs')
})

cfg.set('errors', {
  db: {
    host: 'localhost',
    port: 27017,
    database: 'beekeeper-errors',
    options: {
      server: {
        auto_reconnect: true,
        poolSize: 5
      },
      db: {
        native_parser: true
      }
    },
    collections: {
      errors: {
        name: 'beekeeper_errors_events'
      }
    }
  }
})


// Specific configuration per environment
cfg.env('test', function() {
  cfg.get('security').db.database += '-test';
  cfg.get('dashboards').db.database += '-test';
  cfg.get('hierarchy').db.database += '-test';

  cfg.get('logs').db.database += '-test';
  cfg.get('errors').db.database += '-test';

  cfg.get('api').port += 10;
  // cfg.get('api')['socket.io'].log = true;
});

cfg.env('dev', function() {
});

cfg.env('qualification', function() {
  cfg.get('security').db.database = 'beekeeper';
  cfg.get('dashboards').db.database = 'beekeeper';
  cfg.get('hierarchy').db.database = 'beekeeper';
  cfg.get('errors').db.database = 'beekeeper';
});

cfg.env('production', function() {
  cfg.get('security').db.database = 'beekeeper';
  cfg.get('dashboards').db.database = 'beekeeper';
  cfg.get('hierarchy').db.database = 'beekeeper';
  cfg.get('errors').db.database = 'beekeeper';
  cfg.get('api')['socket.io'].level = 2;
});

cfg.env('openshift', function() {
  cfg.get('api').host = process.env.OPENSHIFT_NODEJS_IP;
  cfg.get('api').port = 17000;
  ['hierarchy', 'dashboards', 'security', 'logs', 'errors'].forEach(function (domain) {
    cfg.get(domain).db.host = process.env.OPENSHIFT_MONGODB_DB_HOST;
    cfg.get(domain).db.port = +process.env.OPENSHIFT_MONGODB_DB_PORT;
    cfg.get(domain).db.options.user = process.env.OPENSHIFT_MONGODB_DB_USERNAME;
    cfg.get(domain).db.options.pass = process.env.OPENSHIFT_MONGODB_DB_PASSWORD;
    cfg.get(domain).db.database = process.env.OPENSHIFT_APP_NAME;
  });
  cfg.get('evaluator').event.url =  'ws://' + process.env.OPENSHIFT_NODEJS_IP + ':' + 15000 + '/1.0/event/get';
  cfg.get('evaluator').metric.url =  'ws://' + process.env.OPENSHIFT_NODEJS_IP + ':' + 15000 + '/1.0/metric/get';
  cfg.get('api')['socket.io'].log = true;
  cfg.get('api')['socket.io'].level = 2;
  cfg.get('api')['socket.io'].transports = ['xhr-polling'];
});
