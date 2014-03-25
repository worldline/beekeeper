var mongoose    = require('mongoose')
  , Schema      = mongoose.Schema
  , cfg         = require('../config')
  , logConfig   = cfg.get('logs')

var connStr = 'mongodb://' + logConfig.db.host + ':' + logConfig.db.port + '/' + logConfig.db.database
  , db = mongoose.createConnection(connStr, logConfig.db.options)

var logSchema = new Schema({
  level: {
    type: String,
    index: true,
    required: true
  },
  user: {
    type: String,
    index: true
  },
  data: [{}],
  file: {
    type: String
  }
}, { versionKey: false });

module.exports = db.model('Logs', logSchema, logConfig.db.collections.logs.name);
