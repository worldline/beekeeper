define(['underscore', 'backbone', 'hbs!./template', '../item/view', '../item/model'], function(_, Backbone, template, SelectionItemView, SelectionItemModel) {

  return Backbone.View.extend({

    initialize: function(options) {
      _.bindAll(this, 'addItem', 'removeItem');

      this.$parent = options.parent;
      this.items = [];

      this.render();
      this.attach();
    },

    render: function() {
      this.$el.html(template());
      return this;
    },

    attach: function() {
      this.$parent.find('.content').append(this.$el);
    },

    addItem: function(selection) {
      this.items.push(new SelectionItemView({
        model: new SelectionItemModel({
          selection: selection
        }),
        parent: this,
        className: 'selection'
      }));
    },
    removeItem: function(item) {
      var index = this.items.indexOf(item);
      if(index > -1) {
        this.items.splice(index, 1);
      }
    }
  });
});
