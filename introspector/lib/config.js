var cfg = module.exports = require('cfg').createConfig();

// Common configuration
cfg.set('mongo-host', '127.0.0.1');
cfg.set('mongo-port', 27017);
cfg.set('mongo-database', 'cube-events');
cfg.set('mongo-username', null);
cfg.set('mongo-password', null);
cfg.set('mongo-target-database', 'cube');

// Specific configuration per environment
cfg.env('openshift', function() {
  cfg.set('mongo-host', process.env.OPENSHIFT_MONGODB_DB_HOST);
  cfg.set('mongo-port', +process.env.OPENSHIFT_MONGODB_DB_PORT);
  cfg.set('mongo-username', process.env.OPENSHIFT_MONGODB_DB_USERNAME);
  cfg.set('mongo-password', process.env.OPENSHIFT_MONGODB_DB_PASSWORD);
  cfg.set('mongo-database', process.env.OPENSHIFT_APP_NAME + '-events');
  cfg.set('mongo-target-database', process.env.OPENSHIFT_APP_NAME);
});
