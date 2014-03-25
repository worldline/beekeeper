define(['backbone', 'config', '../node/model'], function(Backbone, config, NodeModel) {

  var Node = Backbone.Model.extend({

    url: function() {
      return config.apiUrl + '/hierarchy';
    },

    initialize: function() {
      this.fetch();
    },

    parse: function(resp) {
      var oldChildren = this.get('children')
      if (oldChildren) {
        oldChildren.forEach(function(child) {
          child.remove();
        });
      }

      resp.forEach(function(child, id) {
        child.parent = this;
        resp[id] = new NodeModel(child);
        resp[id].fetch();
      }, this);

      return {
        children: resp
      };
    }
  });
  return Node;
});