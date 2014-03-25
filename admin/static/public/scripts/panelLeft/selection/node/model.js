define(['backbone', 'config'], function(Backbone, config) {
  var Node = Backbone.Model.extend({
    url: function() {
      return config.apiUrl + '/hierarchy/' + this.get('_id') + '/children';
    },

    initialize: function() {
      this.set({
        legend: ''
      });
    },

    selectionHelper: function() {

    },

    parse: function(resp) {
      if (!resp || resp.message === 'Error: No children found') {
        return;
      }

      resp.forEach(function(child, id) {
        child.parent = this;
        resp[id] = new Node(child);
      }, this);

      return {
        children: resp
      };
    },

    remove: function() {
      // TODO is this correct ?
      // I want to cut a complete branch on this tree, so I have to destroy all reference to child, recursively.
      // Then, because all these childs are orphan (no references), they will be kidnapped by the garbage collector.
      // It might not be necessary, but I also delete the reference to the parent.
      this.get('children').forEach(function(child) {
        child.remove();
      });
      delete this.parent;
      delete this.$parent;
    }
  });

  return Node;
});