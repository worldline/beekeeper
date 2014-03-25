define(['jquery', 'backbone', 'underscore', 'hbs!./template', '../root/view', 'config'], function($, Backbone, _, template, RootView, config) {

  return Backbone.View.extend({

    events: {
      'click .addSelectionButton': 'fetchSelection',
      'click .cancelSelectionButton': 'cancelSelection'
    },

    url: function() {
      return config.apiUrl + '/hierarchy';
    },

    initialize: function(options) {

      this.$parent = options.parent;
      this.children = [];
      _.bindAll(this, 'populate');

      if (this.model.get('children')) {
        this.populate();
      }

      this.model.on('change:children', _.bind(function() {
        // TODO here we have a problem
        // each time the model change, all children models are droped
        // and so, we have to rebuild the tree
        if (this.model.get('children')) {
          this.populate();
        }
      }, this));

      this.render();
      this.attach();
    },

    populate: function() {
      this.model.get('children').forEach(function(child) {
        this.children.push(new RootView({
          parent: this.$el,
          model: child,
          className: 'selectionAxe ' + child.get('name')
        }));

      }, this);
    },

    render: function() {
      // TODO make className stuff instead of templates
      this.$el.html(template());

      return this;
    },

    attach: function() {
      this.$parent.find('.content').append(this.$el);
    },

    fetchSelection: function() {

      var tree = this.$('.selectionTree')
        , selection = [];

      function parse(id, element) {
        var input = $(element).find('> input[type="checkbox"]:not([id^="expand"])')
          , sublevels = $(element).find('> ul > li > input[type="checkbox"]:not([id^="expand"])')
          , current;

        if (input.attr('checked') === 'checked') {
          this.level_ptr.push({ id: input.attr('id') , name:input.attr('data-name')});
        }

        if (input.attr('checked') !== 'checked' && sublevels.length) {

          // Create current subbranch
          current = {
            id: input.attr('id'),
            name : input.attr('data-name'),
            sublevels: {
              total: sublevels.length,
              selected: sublevels.filter(':checked').length,
              list: []
            }
          };

          // Recurse
          $(element).find('> ul > li').each(_.bind(parse, {
            level_ptr: current.sublevels.list
          }));

          // Add current subbranch only if it contains subelement
          if (current.sublevels.list.length > 0) {
            this.level_ptr.push(current);
          }

        }
      }

      tree.find('.selectionAxe').each(_.bind(parse, {
        level_ptr: selection
      }));
      this.consume(selection);
    },

    cancelSelection: function() {
      this.$('.selectionTree input:checked + label').click();
    }
  });
});
