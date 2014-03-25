var http = require('http'),
  express = require('express'),
  expressns = require('express-namespace'),
  fileUploadCleaner = require('connect-fileupload-cleaner'),
  cfg = require('./config.js'),
  apiConfig = cfg.get('api'),
  router = require('./router'),
  security = require('./controllers/security'),
  dashboardsControllers = require('./controllers/dashboards'),
  widgetsControllers = require('./controllers/widgets'),
  hierarchyControllers = require('./controllers/hierarchy'),
  errorsControllers = require('./controllers/errors'),
  io = require('./websocket/socket.io-wrapper'),
  Logger = require('./logger');

var app = express(),
  server = http.createServer(app),
  logger = new Logger(module),
  env = process.env['NODE_ENV'] || 'development';

// Prepare Socket.IO configuration on this server
io.configure(server);
// Gzipping of all the assets
app.use(express.compress())

app.configure(function () {
  app.use(express.cookieParser(cfg.get('security').secret));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(fileUploadCleaner());
  app.use(security.setup);
  app.use(security.session);
  app.use(app.router);
  app.use(function (err, req, res, next) {
    logger.error('Unexpected error', err);

    // Pre-process the error to avoid leaking too much information when in production
    err = (env === 'production' || env === 'openshift') ? http.STATUS_CODES[res.statusCode] : (err.stack || err.toString());
    res.json(500, err);

    // Do NOT call next to avoid default connect behavior
  });

  // Enable CORS from anywhere
  app.all('*', function (req, res, next) {
    res.set('Access-Control-Allow-Origin', req.headers.origin);
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-HTTP-Method-Override, Accept');
    res.set('Access-Control-Allow-Credentials', true);

    if (req.method === 'OPTIONS') {
      return res.end();
    }

    next();
  });

  router.addRoutes(app);
});

module.exports = {
  start: function (callback) {
    if (server._handle) {
      // Do not restart the server if already opened.
      return server;
    }

    return server.listen(apiConfig.port, apiConfig.host, callback);
  },
  stop: function (callback) {
    if (server._handle) {
      server.once('close', function () {
        process.nextTick(callback);
      });

      server.close();
    } else {
      callback();
    }

    return server;
  }
}
