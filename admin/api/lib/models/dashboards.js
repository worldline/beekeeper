var mongoose          = require('mongoose')
  , cfg               = require('../config')
  , dashboardsConfig  = cfg.get('dashboards')
  , Schema            = mongoose.Schema
  , ObjectId          = Schema.ObjectId

var connStr = 'mongodb://' + dashboardsConfig.db.host + ':' + dashboardsConfig.db.port + '/' + dashboardsConfig.db.database
  , db = mongoose.createConnection(connStr, dashboardsConfig.db.options)

// A user get some dashboards and a default selected dashboard,
// we want to be sure that only one Dashboards exist for each user
var dashboardsSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  dashboards: [{
    name: {
      type: String,
      index: true,
      required: true
    }
  }],
  selectedDashboard: {
    type:ObjectId
  }
}, { versionKey: false });

// Ensures there is a default dashboard
dashboardsSchema.pre('save', function(next){
  if(!this.selectedDashboard && this.dashboards && this.dashboards.length){
    this.selectedDashboard = this.dashboards[0]._id;
  }
  next();
});

module.exports = db.model('Dashboards', dashboardsSchema);
