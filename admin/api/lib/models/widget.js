var mongoose          = require('mongoose')
  , cfg               = require('../config')
  , dashboardsConfig  = cfg.get('dashboards')
  , Schema            = mongoose.Schema
  , ObjectId          = Schema.ObjectId

var connStr = 'mongodb://' + dashboardsConfig.db.host + ':' + dashboardsConfig.db.port + '/' + dashboardsConfig.db.database
  , db = mongoose.createConnection(connStr, dashboardsConfig.db.options)
  , formulaSchema = new Schema({
      element : String,
      type : { type: String },
      refresh : Number,
      width :Number,
      name : String,
      position: String
    }, { strict: false, versionKey: false })
  , widgetSchema = new Schema({
      // the widget can be find by a user
      username: {
        type: String,
        required: true,
        index: true
      },
      dashboard: { // and belong to a dashboard
        type: ObjectId,
        required: true
      },
      name:{
        type: String,
        required: true
      },
      position_x: {
        type: Number,
        required: true,
        default : 0
      },
      position_y: {
        type: Number,
        required: true,
        default: 0
      },
      type: {
        type: String,
        required: true
      },
      width: {
        type: Number,
        required: true,
        default: 1
      },
      height: {
        type: Number,
        required: true,
        default: 1
      },
      formulas : [formulaSchema]
    }, { versionKey: false });

module.exports = db.model('Widget', widgetSchema);
