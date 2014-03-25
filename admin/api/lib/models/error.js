var mongoose      = require('mongoose')
  , cfg           = require('../config')
  , errorsConfig  = cfg.get('errors')
  , Schema        = mongoose.Schema

var connStr = 'mongodb://' + errorsConfig.db.host + ':' + errorsConfig.db.port + '/' + errorsConfig.db.database;
var db = mongoose.createConnection(connStr, errorsConfig.db.options);

var errorSchema = new Schema({
  d: {
    host: { type: String },
    type: { type: String, default: 'error' },
    user: { type: String },
    error: { type: [] }
  }
}, { versionKey: false });

module.exports = db.model('Error', errorSchema, errorsConfig.db.collections.errors.name);
