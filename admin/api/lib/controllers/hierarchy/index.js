var Node = require('../../models/node'),
  service = require('./services')

  function returnError(res, err) {
    return res.json(503, {
      message: err.toString()
    });
  }

module.exports = {
  getRoots: function(req, res, next) {
    Node.roots(function(err, nodes) {
      if (err) {
        return returnError(res, err);
      }
      res.json(nodes)
    })
  },

  getNodeById: function(req, res, next) {
    Node.find({ _id: req.params.id }).sort({ name: 1})
      .exec(function(err, node) {
        if (err) {
          return returnError(res, err);
        }
        if (node && node.length) {
          return res.json(node)
        }
        res.json(404, {
          message: 'No Node found'
        })
      })
  },

  getChildrenByParentId: function(req, res, next) {
    Node.find({
      parent: req.params.id
    }, function(err, children) {
      if (err) {
        return returnError(res, err);
      }
      if (children && children.length) {
        return res.json(children.sort({
          name: 1
        }))
      }
      res.send(204);
    })
  },

  getNodeByNameAndParentId: function(req, res, next) {
    Node.findOne({
      parent: req.params.id,
      name: req.params.name
    }, function(err, node) {
      if (err) {
        return returnError(res, err);
      }
      if (node) {
        return res.json(node)
      }
      res.json(404, {
        message: 'No Node found'
      })
    })
  },
  getFullParentsTrees: function(req, res) {
    service.getFullParentsTrees(req.body, function(err, tree) {
      if (err) {
        return returnError(res, err);
      }
      res.json(tree);
    })
  }
}