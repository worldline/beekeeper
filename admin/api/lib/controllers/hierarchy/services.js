var Node = require('../../models/node'),
  _ = require('underscore'),
  async = require('async');

exports.getParentsTree = function getParentsTree(id, callback) {
  id = id.id || id;
  Node.findOne({
    _id: id
  }, function(err, node) {
    if (err) {
      callback(err);
    }
    if (node) {
      var reduce = {};
      async.parallel([

      function(cb) {
        Node.find({
          $or: [{
            _id: {
              $in: node.ancestors
            }
          }, {
            _id: id
          }]
        }).sort({
          "ancestors.length": -1
        }).exec(cb);
      }, function(cb) {
        Node.find({
          $or: [{
            parent: {
              $in: node.ancestors
            }
          }, {
            _id: id
          }]

        }).exec(cb);
      }],

      function(err, results) {
        if (err) {
          callback(err)
        }
        var groups = _.groupBy(results[1], 'parent'),
          memo = {},
          toReturn = _.reduce(results[0], function(memo, value) {
            memo.id = value.id;
            memo.name = value.name;

            var group = groups[_.find(Object.keys(groups), function(group) {
              return group === value.id
            })];
            if (group) {
              memo.sublevels = {
                list: [{}],
                selected: 0,
                total: group.length
              };
              return memo.sublevels.list[0];
            }
            // last iteration
            return;
          }, memo)

          callback(null, memo);


      })
    }
  })
}


exports.getFullParentsTree = function getFullParentsTree(ids, callback) {
  async.map(ids, exports.getParentsTree, function(err, trees) {
    if (err) {
      return callback(err)
    }
    if (trees.length < 2) {
      return callback(null, trees);
    }
    //we got severals trees now we merge them 1 by 1
    var myreduce = function(memo, tree) {

        var tomerge = _.find(memo, function(item) {
          return item.id === tree.id
        })
        if (!tomerge) {
          memo.push(tree)
          return memo;
        }

        if (tomerge.sublevels) {
          if (!tree.sublevels) {
            return memo;
          }

          // only case where the merge is harder
          tomerge.sublevels.selected += tree.sublevels.selected;
          //reducing lists
          tomerge.sublevels.list = _.reduce(tree.sublevels.list, myreduce, tomerge.sublevels.list);

          return memo;

        } else {
          if (tree.sublevels) {
            tomerge.sublevels = tree.sublevels
          }
          return memo;
        }
        //need to merge them
      },
      toReturn = _.reduce(trees, myreduce, []);

    callback(null, toReturn);
  })

}

/**
  idss, is an array of array of id*/
exports.getFullParentsTrees = function getFullParentsTrees(idss, callback) {
  async.map(idss, exports.getFullParentsTree, function(err, treess) {
    if (err) return callback(err);
    var filtered = _.reduce(treess, function(memo, item) {
      var stringified = JSON.stringify(item);
      memo[stringified] = memo[stringified] || item;
      return memo;
    }, {})

    callback(null, _.map(Object.keys(filtered), function(key) {
      return filtered[key]
    }));


  });

}