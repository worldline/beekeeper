var Widgets     = require('../../models/widget')
  , Logger      = require('../../logger')
  , logger      = new Logger(module)

// List alls widgets for the user
module.exports.listWidgets = function(req, res) {
    Widgets.find({ username: req.user.username }, function(err, docs) {
      if (err) {
        return res.json(503, err);
      }
      if (!docs || !docs.length) {
        return res.send(204); // 204 no content
      }
      return res.json(docs);
    })
  }

exports.updateWidgets = function(req, res) {
  if (!req.params.id) {
    return res.send(400, {
      error: "No _id provided in the url"
    });
  }

  delete req.body._id;
  delete req.body.username;

  Widgets.update({ username: req.user.username, _id: req.params.id }, { $set: req.body }, function(err, docs) {
    if (err) {
      return res.json(503, err);
    }
    if (docs === 0) {
      return res.send(404, {
        error: "Document with id " + req.params.id + " not found or access forbidden"
      });
    }

    return res.send(204); // OK no content
  })
}

exports.deleteWidgets = function(req, res) {
  if (!req.params.id) {
    return res.send(400, {
      error: "You need to specify an id parameters"
    });
  }

  Widgets.remove({ username: req.user.username, _id: req.params.id }, function(err, docs) {
    var anyDoc = docs === 0;
    if (err || anyDoc) {
      if ((err && err.name === "CastError") || anyDoc) {
        return res.send(404, {
          error: "Document with id " + req.params.id + " not found or access forbidden"
        });
      }
      logger.log("An error occured", err);
      return res.json(503, {
        error: "An unknow error occured"
      });
    }
    if (docs > 1) {
      //this should not happen
      logger.log("An invalid state appends :  delete widgets return ", docs, "documents.", "Query was for user", req.user.username, "and for id ", req.params.id);
      return res.send(500, {
        error: "Please check your document key"
      });
    }
    logger.user(req.user.username).info( "deleted widget <"+req.params.id+">")
    return res.send(204);
  })
}

exports.createWidgets = function(req, res) {
  delete req.body._id;
  req.body.username = req.user.username;
  Widgets.create(req.body, function(err, doc) {
    if (err) {
      return res.json(503, err);
    }
    logger.user(req.user.username).info( "created a new widget")
    return res.json(doc);
  })
}
