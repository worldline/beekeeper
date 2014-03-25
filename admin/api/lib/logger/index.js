/*global module: true*/
var Log               = require('../models/logentry')
  , _                 = require('lodash')
  , failoverStream    = require('fstream').Writer({ path: require('../config').get('logs').failover, flags: 'a' })

var Logger = module.exports = function (mod) {
  if(!(this instanceof Logger)) { return new Logger(mod) }

  var noChain = this;

  // Give access to the stream for testing purpose
  this.writeStream = failoverStream

  if(!mod) {
    mod = module // Default module to self
  }

  this.path     = mod.filename;
  this.levels   = ['trace', 'debug', 'log', 'info', 'warn', 'error', 'fatal'];
  this.userChain = {anonymous: (function(){return noChain}).bind(this)};

  // Make shortcut functions for levels
  this.levels.forEach(function (level) {
    this[level] = this._makeLog.bind(this, level, null)
  }, this)

  this.user = (function reportUser(user) {
    if(!user) {
      return this;
    }

    this.userChain.user = user;
    return this.userChain;
  }).bind(this);

  this.levels.forEach(function (level) {

    this[level] = (function() {
      noChain._makeLog.bind(this, level, this.user).apply(noChain, arguments)
      return this;
    }).bind(this)

  }, this.userChain)

  this.userChain.writeStream = failoverStream; // needed for tests

  _.bindAll(this);
}

Logger.prototype._makeLog = function (level, user) {
  var args = arguments, self = this

  process.nextTick(function(){
    // Default to 'log' level if unknown level
    if(!~self.levels.indexOf(level)) { level = 'log' }

    var log = { level: level, file: self.path, user:user }


    if (args.length >= 3) {
      // Arguments other than level are used as log data
      log.data = Array.prototype.slice.call(args, 2).map(function(arg) {
        if(arg instanceof Error) {
          // Errors are encapsulated in order to log them well
          arg = _.extend({
            name: arg.name,
            message: arg.message,
            stack: arg.stack
          }, arg)
        }
        if(typeof arg === "string") {
          return arg;
        }
        return JSON.stringify(arg)
      })
    }
    self._log(log)
  })
}

Logger.prototype._log = function (log) {
  // Use native mongodb insertion for speed's sake
  Log.collection.insert(log, function (err) {
    if (!err) { return }
    failoverStream.write(JSON.stringify(log) + '\n')
  })
}
