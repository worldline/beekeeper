define(['backbone'], function(Backbone) {
  return Backbone.View.extend({
    events: {
      'click': 'clicked'
    },

    initialize: function(options) {
      this.$parent = options.parent;
      this.$el.addClass('widget empty w1 h1 t1 l1 icon-plus-sign glow-icon');
    },

    attach: function () {
      this.$parent.append(this.$el);
    },

    detach: function () {
      this.$el.detach();
    },

    clicked: function() {
      Backbone.trigger('widget:new', this);
    }
  });
});
