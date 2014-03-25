var _         = require('lodash'),
  async  = require('async'),
  resolver = require('../hierarchyResolver'),
  Node     = require('../models/node')

module.exports = function (msg, callback) {
  var self = this, msg, originalExpression, parsed;

  try {
    msg = JSON.parse(msg);
    originalExpression = msg.expression;
    parsed = resolver.parse(originalExpression);
  } catch (err) {
    return callback(err, msg);
  }

  async.map(parsed.exprs, function findSelection(selection, callback) {
    async.map(selection, function interestDescendantsHosts(dimension, cb) {
      Node.unionOfDescendantsOfType('host', dimension, cb);
    }, function onResults(err, dimensionHosts) {
      if(err) {
        return callback(err);
      }
      var selectionHostList = _.intersection.apply(this, dimensionHosts);
      callback(null, selectionHostList);
    })
  }, function onSelectedHostForDimensionResolved(err, selectedHosts) {
    if (err) {
      return callback(err, 'Bad selection in expression <', parsed , '>:');
    }

    msg.expression = parsed.explode.apply(this, selectedHosts);
    callback(null, msg);
  });
}
