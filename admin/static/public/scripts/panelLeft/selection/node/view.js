define(['underscore', 'backbone', 'hbs!./template'], function(_, Backbone, template) {

  var NodeView = Backbone.View.extend({

    events: {
      "click [for^=expand]": "expand",
      "click label:not([for^='expand'])": "modifyHelper"
    },

    tagName: "li",

    initialize: function(options) {

      this.parent = options.parent;
      this.$parent = this.parent.$el;
      this.children = [];
      this.selected = 0;
      this.isSelected = -1;

      this.render();
      this.attach();

      if (this.model.get('children')) {
        this.populate();
      }

      this.model.on('change:children', _.bind(function() {
        if (this.children.length === 0) {
          this.render();
          this.populate();
        } else {
          this.populate();
        }
      }, this));
    },

    populate: function() {
      var childrenModel = this.model.get('children');

      childrenModel.forEach(function(child, index) {
        if (!this.children[index]) {
          this.children[index] = new NodeView({
            parent: this,
            model: child
          });
        }
      }, this)
    },

    render: function() {
      this.$el.html(template(this.model.attributes));
      return this;
    },

    attach: function() {
      this.$parent.find('> ul').append(this.$el);
    },

    detach: function() {
      this.$el.detach();
    },

    remove: function() {
      this.children.forEach(function(child) {
        child.remove();
      });
      this.$el.remove();
    },

    expand: function() {
      if (!this.expanded) {
        this.expanded = true;
        this.model.get('children').forEach(function(child) {
          child.fetch();
        });
      }
      return true;
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
      // selected will be incremented from 0 -> at least a child have been selected
      if (this.selected === 0 && this.isSelected < 0) {
        this.parent.childSelected(1);
      }

      this.setSelection(this.selected += increment);

      // selected have been decremented to 0 -> no more children are selected
      if (this.selected === 0 && this.isSelected < 0) {
        this.parent.childSelected(-1);
      }
    },

    modifyHelper: function(event) {
      this.isSelected = (this.$el.children('input:not([id^="expand"]):checked').length === 0) ? 1 : -1;

      this.setSelection(this.selected);

      if (this.selected === 0) {
        this.parent.childSelected(this.isSelected);
      }

      event.stopImmediatePropagation()
    }
  });

  return NodeView;
});
