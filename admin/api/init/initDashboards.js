//
// Initialize a default user with a few widgets.
//

var fs = require('fs'),
  path = require('path'),
  User = require('../lib/models/user'),
  Dashboards = require('../lib/models/dashboards'),
  WidgetModel = require('../lib/models/widget'),
  ApiKey = require('../lib/models/apikey'),
  async = require('async'),
  crypto = require('crypto'),
  cfg = require('../lib/config'),
  securityConfig = cfg.get('security');

function hashPassword(password) {
  var sha256 = crypto.createHash(securityConfig.hashType)
  sha256.update(password)
  return sha256.digest(securityConfig.digestType)
}

function S4() {
  return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1);
}
function genApiKey() {
  return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4()).toLowerCase();
}

function initUser(done) {
  User.count({}, function (err, count) {
    if (err) {
      console.log("Unable to cound users!");
      return done(err);
    }
    if (count > 0) {
      console.log("Users already exist, finishing.");
      return process.exit(0);
    }
    User.create({
      "username": "admin",
      "password": hashPassword('admin')
    }, done);
  });
}

//init apikey
function initApiKey(done) {
  ApiKey.remove({}, function (err) {
    if (err) {
      console.log("Unable to remove ApiKeys");
      return done(err)
    }
    var apikey = genApiKey();
    new ApiKey({apikey: apikey}).save(function (err, docs) {
      if (err) {
        console.log("Unable to save ApiKey");
        return done(err)
      }
      console.log("ApiKey inited:");
      console.log("  apikey: " + apikey);
      done();
    });
  });
}

//delete widgets
function clearWidget(done) {
  WidgetModel.remove({}, done);
}

//delete and init the dashboards
function initDashBoards(done) {
  Dashboards.remove({}, function (err) {
    if (err) {
      console.log("Unable to remove Dashboards");
      return done(err)
    }
    var dashboards = new Dashboards({
      username: "admin",
      dashboards: [{
        name: "System informations"
      }, {
        name: "Empty dashboard"
      }]
    })

    dashboards.save(function (err, docs) {
      if (err) {
        console.log("Unable to save Dashboard");
        return done(err)
      }
      var widgets = [
        new WidgetModel({
          name: 'Free Memory',
          username: "admin",
          dashboard: docs.dashboards[0]._id,
          position_x: 1,
          position_y: 1,
          type: 'memory',
          height: 1,
          width: 1,
          formulas: [{
            kind: "metric",
            position: "left",
            expression: "min(memory(used))",
            step: 10000, //secondes
            limit: 360, // 1 Hour
            name: "Min",
            type: "min",
            maxWarningThreshold: 700,
            maxErrorThreshold: 800,
          }, {
            kind: "metric",
            position: "right",
            expression: "max(memory(used))",
            step: 10000, //secondes
            limit: 360, // 1 Hour
            name: "Max",
            type: "max",
            maxWarningThreshold: 800,
            maxErrorThreshold: 900,
          }, {
            kind: "metric",
            position: "main",
            expression: "avg(memory(used))",
            step: 10000, //secondes
            limit: 1, // 1 Hour
            name: "Current",
            type: "last",
            maxWarningThreshold: 700,
            maxErrorThreshold: 900,
          }]
        }),
        new WidgetModel({
          name: 'Percent',
          username: "admin",
          dashboard: docs.dashboards[0]._id,
          position_x: 2,
          position_y: 1,
          type: 'tendency',
          height: 1,
          width: 1,
          formulas: [{
            kind: "metric",
            position: "left",
            expression: "sum(memory(used)) / sum(memory(used|cached|buffered|free))",
            step: 10000, //secondes
            limit: 360, // 1 Hour
            name: "Min",
            type: "min",
            maxWarningThreshold: 70,
            maxErrorThreshold: 80,
          }, {
            kind: "metric",
            position: "right",
            expression: "sum(memory(used)) / sum(memory(used|cached|buffered|free))",
            step: 10000, //secondes
            limit: 360, // 1 Hour
            name: "Max",
            type: "max",
            maxWarningThreshold: 80,
            maxErrorThreshold: 92,
          }, {
            kind: "metric",
            position: "main",
            expression: "sum(memory(used)) / sum(memory(used|cached|buffered|free))",
            step: 10000, //secondes
            limit: 1, // 1 Hour
            name: "Current",
            type: "last",
            maxWarningThreshold: 80,
            maxErrorThreshold: 90,
          }]
        }),
        new WidgetModel({
          name: 'Used Ram',
          username: "admin",
          dashboard: docs.dashboards[0]._id,
          position_x: 3,
          position_y: 1,
          type: 'graph',
          width: 2,
          height: 1,
          formulas: [{
            kind: "metric",
            position: "avg",
            expression: "avg(memory(used))",
            step: 60000, //secondes
            limit: 49,
            name: "avg"
          }, {
            kind: "metric",
            position: "min",
            expression: "min(memory(used))",
            step: 60000, //secondes
            limit: 49,
            name: "min"
          }, {
            kind: "metric",
            position: "max",
            expression: "max(memory(used))",
            step: 60000, //secondes
            limit: 49,
            name: "max"
          }, {
            kind: "metric",
            position: "total",
            expression: "avg(memory(used)) + avg(memory(free)) + avg(memory(cached)) + avg(memory(buffered))",
            step: 60000,
            limit: 49,
            name: "total"
          }]
        }),
        new WidgetModel({
          name: 'Simple graph',
          username: "admin",
          dashboard: docs.dashboards[0]._id,
          position_x: 4,
          position_y: 2,
          type: 'linechart',
          width: 3,
          height: 3,
          formulas: [{
            kind: "metric",
            expression: "avg(cpu(user))",
            step: 10000, //secondes
            limit: 49,
            name: "event"
          }]
        })
      ]

      async.forEach(widgets, function (widget, cb) {
        widget.save(cb)
      }, done)
    })
  })
}


initUser(function (err) {
  if (err) {
    console.log("Failed to init users");
    console.log(err);
    process.exit(1);
  }
  console.log("User inited:");
  console.log("  login: admin");
  console.log("  password: admin");
  clearWidget(function (err) {
    if (err) {
      console.log("Failed to cleanup widgets");
      console.log(err);
      process.exit(1);
    }
    initDashBoards(function (err) {
      if (err) {
        console.log("Failed to init dashboards");
        console.log(err);
        process.exit(1);
      }
      initApiKey(function (err) {
        if (err) {
          console.log("Failed to init apikey");
          console.log(err);
          process.exit(1);
        }
        process.exit(0);
      });
    });
  });
});
