define(['backbone', 'underscore', 'config', 'widgets/model', './placefinder'], function (Backbone, _, config, WidgetModel, placeFinder) {
  var WidgetCollection = Backbone.Collection.extend({
    model: WidgetModel
  });

  return Backbone.Model.extend({
    idAttribute: '_id',

    defaults: {
      name: 'dashboard default',
      height: 4,
      width: 7
    },

    urlRoot: config.apiUrl + '/user/me/dashboards/dashboard',

    constructor: function () {
      this.widgets = new WidgetCollection();
      Backbone.Model.apply(this, arguments);
    },

    initialize: function () {
      var self = this;

      // Receive calls to save an existing or a new widget
      Backbone.on('widget:save', function (widget) {
        if (widget.dashboard !== self.id) {
          // This dashboard is not concerned by this widget
          return;
        }

        if (!widget._id) {
          // That wasn't an edition, we must find a place for this widget
          _.extend(widget, self.findPosition(widget.height, widget.width));
        }

        self.createWidget(widget);
      });

      Backbone.on('widget:created', function (widget) {
        // 3 cases can happen :
        // - We owned this widget but it moved to another dashboard
        // - We still own this widget, but we want to remove its previous instance after edition
        // - This widget is on another dashboard, nothing happens,
        //    we just avoid a check in the model since remove already does this.
        self.widgets.remove(widget);

        if (self.id === widget.get('dashboard')) {
          // The created widget should be added to the current dashboard
          self.widgets.add(widget);
        }
      });

      Backbone.on('widget:remove', function (widget) {
        if (self.id === widget.get('dashboard')) {
          self.widgets.remove(widget);
        }
      });

      self.on('destroy', self.destroyed);
    },

    destroyed: function () {
      this.widgets.each(function (widget) {
        widget.destroy();
      });
    },

    parse: function (data) {
      if (!data) return; // Probably the 204 return we get when we rename the dashboard

      // Initialize widgets collection with new ones
      this.widgets.reset(data.widgets);
      return data;
    },

    /**
     * Create a brand new widget.
     * @param  {Object} attributes Properties of the widget.
     */
    createWidget: function (attributes) {
      var widget = new WidgetModel(attributes);
      if (!attributes._id) {
        widget.newlyCreated = true;
      }

      widget.save(null, {
        success: function () {
          Backbone.trigger('widget:created', widget);
        },
        error: function () {
          Backbone.trigger('widget:create-error', widget);
        }
      });
    },

    findPosition: function (widgetHeight, widgetWidth) {
      return placeFinder(this.get('width'), this.get('height'), widgetWidth, widgetHeight, this.widgets);
    }
  });
});
