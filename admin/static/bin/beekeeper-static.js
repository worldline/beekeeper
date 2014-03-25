#!/usr/bin/env node
var http          = require('http')
  , express       = require('express')
  , lessCompiler  = require('less-middleware')
  , fs            = require('fs')
  , path          = require('path')
  , cache         = require("memory-cache")
  , env           = process.env['NODE_ENV'] || 'development'
  , rootPath      = path.join(__dirname, '..')
  , publicPath    = path.join(rootPath, 'public')
  , scriptsPath   = path.join(rootPath, 'generated/scripts')
  , config        = fs.readFileSync(path.join(rootPath, 'config', env + '.js'));

var validApiKeyTtl = 1000 * 60 * 3 // 3 minutes
  , invalidApiKeyTtl = 1000 * 60; // 1 minute

var stylePath = path.join(publicPath, 'styles')
  , style = path.join(stylePath, 'style.css');

// Always remove generated css to avoid mess up on external modification of less files (ie. git pull)
if (fs.existsSync(style)) {
  fs.unlinkSync(style);
}
if (!fs.existsSync(stylePath)) {
  fs.mkdirSync(stylePath);
}

var app = express(), server = http.createServer(app);
app.use(express.compress());

// Serve configuration depending on the environment
app.get('/scripts/config.js', function (req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(config);
});

// Generate a dynamic list of available widgets
app.get('/scripts/widgets/list.js', require('./widgetList'));

if (env === 'openshift') {
  var httpProxy = require('http-proxy');
  var apikeyregex = /^\/[a-z0-9]+\/1.0\/event\/put/;
  var noapikeyregex = /^\/1.0\/event\/put/;

  var rewriteUrl = function(req, toRemove) {
    req.url = req.url.replace(toRemove,'');
    req.url = req.url.replace(/\?.*/,'');
  };

  var proxyRequest = function (proxy, req, res, buffer) {
    return proxy.proxyRequest(req, res, {
      host: process.env.OPENSHIFT_NODEJS_IP,
      port: 16000,
      buffer: buffer
    });
  };

  app.use('/api/apikey', function (req, res, next) {
    res.send(404);
  });
  app.use('/api', httpProxy.createServer(17000, process.env.OPENSHIFT_NODEJS_IP));

  app.use('/collector', httpProxy.createServer(function (req, res, proxy) {
    if(req.path === '/') {
      return res.send(403, 'Forbidden');
    }

    var buffer;
    if(!req.path.match(apikeyregex)) {
      if (req.path.match(noapikeyregex)) {
        var allowed = cache.get('NOAPIKEYALLOWED');
        if( allowed === true ) {
          return proxyRequest(proxy, req, res);
        } else if( allowed === false ) {
          return res.send(403, 'Forbidden');
        }
        buffer = httpProxy.buffer(req);
        return http.get('http://' + process.env.OPENSHIFT_NODEJS_IP + ':17000/apikey/isNoApiKeyAllowed', function (_res) {
          if (_res.statusCode === 200) { // allowed
            cache.put('NOAPIKEYALLOWED', true, validApiKeyTtl);
            return proxyRequest(proxy, req, res, buffer);
          }
          cache.put('NOAPIKEYALLOWED', false, validApiKeyTtl);
          res.send(403, 'Forbidden');
        });
      }
      return res.send(406,'Please read documentation!');
    }

    var path = req.path;
    var i = path.indexOf('/',1);
    var key = path.substring(1,i);
    path = path.substring(0,i);
    rewriteUrl(req,path);

    var _key = cache.get(key);
    if (_key === true) {//known valid key
      return proxyRequest(proxy, req, res);
    } else if (_key === false) {// known invalid key
      return res.send(403, 'Forbidden');
    } else {// ask api for api key
      buffer = httpProxy.buffer(req);
      http.get('http://' + process.env.OPENSHIFT_NODEJS_IP + ':17000/apikey/' + key, function (_res) {
        if (_res.statusCode === 200) { // valid key
          cache.put(key, true, validApiKeyTtl);
          return proxyRequest(proxy, req, res, buffer);
        }
        // invalid key
        cache.put(key, false, validApiKeyTtl);
        res.send(403, 'Forbidden');
      }).on('error', function (e) { // on error, do not cache
        res.send(500, 'Internal Server Error');
      });
    }
  }));
}

app.use(lessCompiler({
  src: path.join(rootPath, 'less'),
  dest: path.join(publicPath, 'styles'),
  prefix: '/styles/',
  debug: env === 'development',
  optimization: env === 'development' ? 0 : 2,
  yuicompress: env !== 'development',
  compress: env !== 'development' // Compress CSS if not in development
}));

if (env === 'production' || env === 'qualification' || env === 'openshift') {
  console.warn('** Using scripts from generated bundles in ./generated **');
  app.use('/scripts', express.static(scriptsPath, { maxAge: 60000 }));
}

app.use(express.static(publicPath, { maxAge: 60000 }));

server.listen(process.env.OPENSHIFT_NODEJS_PORT || 8081, process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0', function () {
  var binding = server.address();
  console.log('Static server running on %s:%s', binding.address, binding.port);
});
