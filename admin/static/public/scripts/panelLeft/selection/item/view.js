define(['jquery', 'backbone', 'hbs!./template'], function($, Backbone, template) {
  return Backbone.View.extend({
    events: {
      'click .buttonClose': 'remove'
    },

    initialize: function(options) {
      this.parent = options.parent;
      this.$parent = $(this.parent.$el);

      this.render();
      this.attach();
    },

    render: function() {
      this.$el.html(template(this.model.attributes));
      return this;
    },

    attach: function() {
      this.$parent.append(this.$el);
    },

    remove: function() {
      delete this.model;
      this.parent.removeItem(this);
      this.$el.remove();

      // Does my parents needs to know I killed my self ?
      //this.parent.items.splice ?
    }
  });
});
