#!/usr/bin/env node
var colors = require('colors')
  , Logger = require('../lib/logger')
  , logger = new Logger(module)

var server = require('../').start(function(err) {
  if(err) { throw err }

  var binding = server.address()
  logger.info('-- Server started --', binding.address + ':' + binding.port)
});
