var mongoose        = require('mongoose')
  , cfg             = require('../config')
  , securityConfig  = cfg.get('security')
  , Schema          = mongoose.Schema
;

var connStr = 'mongodb://' + securityConfig.db.host + ':' + securityConfig.db.port + '/' + securityConfig.db.database;
var db = mongoose.createConnection(connStr, securityConfig.db.options);

var userSchema = new Schema({
  username: {
    type:       String,
    unique:     true,
    lowercase:  true,
    trim:       true,
    index:      true,
    required:   true
  },
  password: {
    type:     String,
    required: true
  }
}, { versionKey: false });

module.exports = db.model('User', userSchema, securityConfig.db.collections.users.name);
