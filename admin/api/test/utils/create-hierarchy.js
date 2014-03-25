var Node    = require('../../lib/models/node')
  , _       = require('underscore')

function random (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Expects unlimited arguments of the form :
 {
  types: [ ... ],
  min: value,
  max: value
 }
*/
exports.genTree = function genTree() {
  var nodes = []
    , ancestors = []

  _.each(arguments, function(spec) {
    var level, oldAncestors;
    if(ancestors.length) {
      oldAncestors = ancestors;
      ancestors = [];
      _.each(oldAncestors, function(ancestor) {
        level = genLevel(ancestor.ancestors.concat(ancestor._id), spec.types, spec.min, spec.max);
        _.each(level, function(value) {
          nodes.push.apply(nodes, value);
          ancestors.push.apply(ancestors, value);
        });
      });
    } else {
      level = genLevel(ancestors, spec.types, spec.min, spec.max);
      _.each(level, function(value) {
        nodes.push.apply(nodes, value);
        ancestors.push.apply(ancestors, value);
      });
    }
  });
  return nodes;
}

//genLevel( ['logic', 'physic'] , 1, 3)
//genLevel( ['1'],['namespace', 'redis', 'rawx', 'meta0', 'meta1','meta2'] , 15, 30)
//genLevel( ['2'],'datacenter', 1, 3)
//genLevel( ['10'],'room', 1, 10)
//genLevel( ['11'],'racks', 1, 10)
//genLevel( ['12'],'cluster', 1, 20)
//genLevel( ['13'],'server', 5)
//genLevel( ['18'],'storage device', 5)

//min and max are for each type, not the global
function genLevel(ancestors, types, min, max) {
  if(arguments.length<4) { //no ancestors defined
    max = min;
    min = types;
    types = ancestors;
    ancestors = [];
  }
  ancestors = ancestors || [];
  max = max || min;

  var level = {};
  types.forEach(function createNodeOfType(type) {
    var size = random (min, max);

    for(var i = 0; i<size; i++) {
      var node = genNode(type, ancestors);
      level[node.type] = ( level[node.type] || [] ).concat(node);
    }
  })

  return level;
}

var id = 0;
/* a Node has a name, a type, an id, and optionally ancestors and a parent*/
//genNode(['logic','physic'])
//genNode(['logic','physic'], ['1','2'])
//genNode('logic')
function genNode(types, /*optional*/ancestors) {
  var type;

  if(typeof types === 'string') {
    type = types;
    types = [types];
  } else {
    if(types.length<1) throw "Tried to generate a node with an invalid type choice :" + types;
    type = types.length === 1 ? types[0] : types[random(0, types.length-1)]; //quicker if just 1 value
  }

  // It's really not elegant, but, well, it works.
  if ( type != 'logic' && type != 'geographic' ) {
    var name = type + id++;
  } else {
    var name = type;
  }


  if (ancestors && ancestors.length>0) {
    //usual node
    return new Node({type: type, name: name, ancestors: ancestors, parent: ancestors[ancestors.length-1]});
  }
  //root node
  return new Node({type: type, name: name});
}

function genResource(nodes) {
  var ref = uid();
  nodes.forEach(function(node) {
    if(node.ref) throw "This node is already used by a resource, a node can't be in multiple resources" // or should it ?
    node.ref = ref;
  })
}
