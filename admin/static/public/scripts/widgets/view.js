define(['underscore', 'backbone', 'hbs!widgets/template', 'user/userDashboards', 'notify', 'rename', './warning-tooltips'], function(_, Backbone, template, dashboards, notify) {
  return Backbone.View.extend({
    events: {
      'mousedown .widget-head': 'mouseDown',
      'click [data-edit-widget]': 'launchEdit',
      'click [data-delete-widget]': 'deleteWidget',
      'click [data-rename-widget]': 'rename',
      'dblclick [data-editable]': 'rename'
    },

    initialize: function(options) {
      _.bindAll(this, 'createWidget', 'populateContent', 'tryToAttachContent');

      this.on('startDrag', function() {
        this.model.startDrag();
        this.widgetMoved();
      });
      this.on('stopDrag', function() {
        this.model.stopDrag();
        this.widgetMoved();
      });

      this.listenTo(this.model, {
          'change:position_x change:position_y': this.widgetMoved,
          'remove': this.destroyed,
          'destroy': this.destroyed
        });

      this.$parent = options.parent;

      // Renders the widget placeholder in the grid
      this.render();
      this.attach();
      this.attachContent();
    },

    destroyed: function() {
      // Destroy widget host
      this.remove();

      // Destroy subview
      if (this.contentModel instanceof Backbone.Model) {
        this.contentModel.destroy();
      } else if (this.contentModel instanceof Backbone.Collection) {
        this.contentModel.reset();
      }

      if (this.contentView instanceof Backbone.View) {
        this.contentView.remove();
      }
    },

    widgetMoved: function() {
      this.$el.removeClass().addClass(this.model.getClass());
    },

    rename: function() {
      var self = this,
        titleField = self.$('[data-editable]');

      titleField.rename(function(newName) {
        titleField.attr('title', newName);
        self.model.save({
          name: newName
        });
      });
    },

    attachContent: function() {
      require(['widgets/' + this.model.get('type') + '/index'], this.createWidget);
    },

    createWidget: function(widgetDescriptor) {
      var model = this.model;

      this.contentModel = new widgetDescriptor.Model(null, {
        parent: model
      });
      this.contentView = new widgetDescriptor.View({
        model: this.contentModel
      });

      this.listenToOnce(this.contentModel, 'render', function() {
        this.$('.spinner').toggle(false);
      });

      this.listenToOnce(Backbone, 'widget:' + model.cid + ':data-error', function(error) {
        var $warning = this.$('.data-warning');
        if (error) {
          $warning.data('error', error.error);
        }
        this.$('.spinner').toggle(false);
        this.contentView.$el.toggle(false);
        $warning.show();
      });

      this.listenTo(dashboards, 'change:selectedDashboard', this.tryToAttachContent);
      this.tryToAttachContent(); // Trigger 1st attempt for already visible widgets
    },

    tryToAttachContent: function() {
      if (!this.$el.is(':visible')) {
        return; // Widget is not visible, try again next time
      }

      // Forbid further runs of this function
      dashboards.off('change:selectedDashboard', this.tryToAttachContent);

      // Attach the actual widget to this container
      this.$('.widget-content').append(this.contentView.$el);

      _.defer(this.populateContent);
    },

    populateContent: function() {
      if (this.contentModel.pull) {
        this.contentModel.pull();
      }
      if (this.contentView.populate) {
        this.contentView.populate();
      }
    },

    render: function() {
      // /!\ this might be a very bad way to do (but it works)
      this.$('.widget-head').remove();
      this.$el.removeClass()
        .addClass(this.model.getClass())
        .prepend(template(this.model.toJSON()));

      return this;
    },

    attach: function() {
      this.$parent.append(this.$el);
    },

    mouseDown: function(e) {
      if (this.$(e.target).parents('.button-div').length) {
        return false;
      }
      this.trigger('drag', this);

      // prevent text selection
      return false;
    },

    deleteWidget: function() {
      var self = this;
      self.model.destroy({
        success: function() {
          Backbone.trigger('widget:remove', self.model);
          self.remove();
        },
        error: function() {
          notify({
            title: 'Error',
            body: "The widget hasn't been deleted, please try again"
          });
        }
      });
    },

    launchEdit: function() {
      Backbone.trigger('widget:edit', this);
    }
  });
});
