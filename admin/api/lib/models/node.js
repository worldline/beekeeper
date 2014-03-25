var cfg               = require('../config')
  , hierarchyConfig   = cfg.get('hierarchy')
  , mongoose          = require('mongoose')
  , Schema            = mongoose.Schema
  , ObjectId          = Schema.ObjectId
  , ObjectID          = require('mongodb').ObjectID
;

var connStr = 'mongodb://' + hierarchyConfig.db.host + ':' + hierarchyConfig.db.port + '/' + hierarchyConfig.db.database
  , db = mongoose.createConnection(connStr, hierarchyConfig.db.options);

var nodeSchema = new Schema({
  type: {
    type:       String,
    lowercase:  true,
    trim:       true,
    required:   true,
    index:      true
  },
  name: {
    type:       String,
    lowercase:  true,
    trim:       true,
    required:   true
  },
  ancestors: {
    type:   [ObjectId],
    index:  true
  },
  parent: { // Pointing to direct parent
    type:   ObjectId,
    index:  true
  },
  ref: { // Should be a uuid shared by all of the Nodes representing a Resource
    type:   String,
    index:  true,
    sparse: true
  },
  updated: {
    type:     Date,
    default:  Date.now
  },
  disabled: {
    type:     Boolean,
    index:    true
  }
}, { safe: true, versionKey: false });

var existence = [{disabled: {$exists: false}}, {disabled: false}];

nodeSchema.statics.roots = function getRootNodes (callback) {
  Node.find({'parent': {$exists:false}, $or: existence}).sort({ name: 1}).exec(callback);
}

nodeSchema.statics.types = function getTypes (callback) {
  this.distinct('type', { $or: existence }, callback);
}

nodeSchema.statics.unionOfDescendantsOfType = function (type, nodeIds /*Array of ObjectId*/, callback) {
  var nid = nodeIds.map(function toObjId (node) {
    return new ObjectID(node.id)
  })
  this.distinct( 'name', {
    type: type,
    $or:  [ {'ancestors': {'$in': nid}}, {'_id':{'$in': nid}} ]
  }).exec(callback);
}

nodeSchema.methods.childrenTypes = function getNodeChildrenType (callback) {
  this.distinct('type', { 'parent': this._id, $or: existence }, callback);
}

nodeSchema.methods.children = function getNodeChildren (/*optional*/ type, callback) {
  if(typeof type === 'function') {
    callback = type;
    type = null;
  }
  var query = {'parent': this._id, $or: existence};
  if(type) {
    query.type = type;
  }
  Node.find(query, callback);
}

nodeSchema.methods.disable = function disableRecursively(callback) {
  var query = {
    $and: [
      { $or: existence },
      { $or: [
        { '_id': this._id },
        { 'ancestors': this._id }
      ]}
    ]
  };
  Node.update(query, { disabled: true, updated: Date.now() }, { multi: true }, callback);
  // TODO: doing it this way is atomic but the manipulated node is not refreshed after update
}

nodeSchema.methods.changeParent = function changeParent(parentId, callback) {
  var self = this;
  Node.findById(parentId, function(err, parent) {
    if(err) {
      return callback(err);
    }
    if(!parent) {
      return callback(new Error('Parent not found'));
    }

    var date = Date.now();
    self.parent = parentId;
    self.updated = date;
    self.save(function(err) {
      if(err) {
        return callback(err);
      }
      parent.ancestors.push(parentId);
      var query = {
        $and: [
          { $or: existence },
          { $or: [
            { '_id': self._id },
            { 'ancestors': self._id }
          ]}
        ]
      };
      Node.update(query, { updated: date, $pullAll: { 'ancestors': self.ancestors} }, { multi: true }, function(err) {
        if(err) {
          return callback(err);
        }
        Node.update(query, { $pushAll: { 'ancestors': parent.ancestors } }, { multi: true }, callback);
      });
    });
  });
}

nodeSchema.methods.addChild = function addChild(child, callback) {
  if(!(child instanceof Node)) {
    child = new Node(child);
  }

  child.parent = this._id;
  child.ancestors = this.ancestors.concat(this._id);
  child.updated = Date.now();
  child.save(callback);
}

var Node = module.exports = db.model('Node', nodeSchema, hierarchyConfig.db.collections.nodes.name);
