var Dashboards = require('../../models/dashboards'),
  Widget = require('../../models/widget'),
  Logger = require('../../logger'),
  logger = new Logger(module),
  async = require('async'),
  _ = require('lodash'),
  ObjectId = require('mongodb').ObjectID;

exports.createDashboard = function(req, res) {
  if (!req.body.name) {
    return res.json(400, {
      error: 'no name'
    });
  }
  req.body._id = new ObjectId();
  Dashboards.update({
    username: req.user.username
  }, {
    '$push': {
      dashboards: req.body
    }
  }, {
    upsert: true
  }, function(err, nb) {
    if (!err && nb === 1) {
      logger.user(req.user.username).info('created a new dashboard <' + req.body._id + ':' + req.body.name + '>')
      return res.json({
        _id:  req.body._id,
        name: req.body.name
      });
    }
    logger.user(req.user.username).warn('tried to create a new dashboard unsuccessfully :', err);
    res.json(403, err);
  });
};

exports.deleteDashboard = function(req, res) {
  Dashboards.update({
    username: req.user.username
  }, {
    $pull: {
      dashboards: {
        _id: req.params.id
      }
    }
  }, function(err) {
    if (err) {
      logger.user(req.user.username).warn('tried to delete dashboard <' + req.params.name + '> unsuccessfully:', err);
      return res.json(503, err.toString());
    }
    logger.user(req.user.username).info('deleted dashboard <' + req.params.name + '>')
    return res.send(204); // 204 ok, even if the matching didn't work or no dashboards with this name
  });
};

//FIXME untested yet !!!!
//used only for renaming dashboards right now
exports.updateDashboard = function(req, res) {
  Dashboards.update({
    username: req.user.username,
    'dashboards._id': req.params.id
  }, {
    'dashboards.$': req.body
  }, function(err) {
    if (err) {
      logger.user(req.user.username).warn('tried to update dashboard <' + req.body.name + '> unsuccessfully:', err);
      return res.json(503, err);
    }
    logger.user(req.user.username).info('updated dashboard <' + req.params.id + ':' + req.body.name + '>')
    return res.send(204); // 204 ok, even if the matching didn't work or no dashboards with this name
  });
};

exports.updateSelectedDashboard = function(req, res) {
  Dashboards.update({
    username: req.user.username
  }, {
    'selectedDashboard': req.body.selectedDashboard
  }, function(err) {
    if (err) {
      logger.user(req.user.username).warn('tried to update dashboards for user ' + req.user.username + '> unsuccessfully:', err);
      return res.json(503, err);
    }
    logger.user(req.user.username).info('updated dashboards for user <' + req.user.username + ':' + req.body.selectedDashboard + '>')
    return res.send(204);
  });
}

exports.getFullDashboards = function(req, res) {
  async.parallel({
    dashboard: function(callback) {
      Dashboards.findOne({
        username: req.user.username
      }, callback);
    },
    widgets: function(callback) {
      Widget.find({
        username: req.user.username
      }, callback);
    }
  }, function(err, docs) {
    if (err) {
      return res.json(503, err);
    }
    if (!docs.dashboard) {
      return res.send(204);
    } // This should not append
    if (!docs.widgets.length) {
      return res.json(docs.dashboard);
    } // No widget for this user
    // Group by dashboard
    var widgets_dash = _.groupBy(docs.widgets, 'dashboard');
    docs.dashboard.dashboards.forEach(function(dashboard) {
      dashboard._doc.widgets = widgets_dash[dashboard._id];
    });

    return res.json(docs.dashboard);
  });
};