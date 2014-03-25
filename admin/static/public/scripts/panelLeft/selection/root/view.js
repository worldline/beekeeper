define(['underscore', 'backbone', 'hbs!./template', '../node/view'], function(_, Backbone, template, NodeView) {

  return Backbone.View.extend({

    events: {
      "click [for^=expand]": "expand",
      "click label:not([for^='expand'])": "modifyHelper"
    },

    initialize: function(options) {

      this.$parent = options.parent;
      this.children = [];
      this.selected = 0;
      this.isSelected = -1;

      this.render();
      this.attach();

      if (this.model.get('children')) {
        this.populate();
      }

      this.model.on('change:children', _.bind(function() {
        // TODO here we have a problem
        // each time the model change, all children models are droped
        // and so, we have to rebuild the tree
        if (this.children.length !== this.model.get('children').length) {
          this.render();
          this.attach();
          this.populate();
        } else {
          this.populate();
        }
      }, this));
    },

    populate: function() {
      // TODO, here we have a problem,
      // all the old node are thrown away, we should update them instead.
      this.children.forEach(function(child) {
        child.detach();
      });

      this.children = [];

      this.model.get('children').forEach(function(child) {
        this.children.push(new NodeView({
          parent: this,
          model: child
        }));
      }, this);
    },

    render: function() {
      this.$el.html(template(this.model.attributes));
      return this;
    },

    attach: function() {
      this.$parent.find('.selectionTree').append(this.$el);
    },

    detach: function() {
      this.$el.detach();
    },

    expand: function() {
      if (!this.expanded) {
        this.expanded = true;
        this.children.forEach(function(child) {
          child.model.fetch();
        });

      }
    },

    setSelection: function(number) {

      var stringSelection = '';

      if (this.isSelected < 0) {
        if (!number) {
          stringSelection = '';
        } else if (number < this.children.length) {
          stringSelection = number + ' of ' + this.children.length + ' selected';
        } else {
          stringSelection = 'all selected';
        }
      }

      this.model.set({
        legend: stringSelection
      });
      this.$el.children('label:not([for^="expand"])').children('.legend').html(stringSelection);
    },

    childSelected: function(increment) {
      this.setSelection(this.selected += increment);
    },

    modifyHelper: function(event) {
      this.isSelected = (this.$el.children('input:not([id^="expand"]):checked').length === 0) ? 1 : -1;
      this.setSelection(this.selected);

      event.stopImmediatePropagation()
    }
  });
});
