var EventEmitter = require('events').EventEmitter,
  collectd = require('cube/lib/cube/collectd'),
  cubeConfig = require('cube/lib/cube/config');

cubeConfig.load(require("../../bin/config"));

function noOp() {}

exports.putter = function(json) {
  var result, request = new EventEmitter(),
    response = new EventEmitter();

  response.writeHead = response.end = noOp;

  collectd.putter(function fakePutter(value) {
    return result = value;
  })(request, response)

  request.emit("data", json);
  request.emit("end");

  return result;
}
