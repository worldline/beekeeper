define(['jquery', 'underscore', 'backbone', 'user/userDashboards', 'widgets/view', 'widgets/empty/view'], function($, _, Backbone, dashboards, WidgetView, EmptyWidgetView) {

  /* from grid.less :
   * (@widget-unit + @widget-margin) : 129
   * @columns + 1 : 8
   * @rows + 1 : 5
   */
  var widgetOffset = 129,
    columns = 8,
    rows = 5;

  return Backbone.View.extend({
    className: 'widget-container grid',

    events: {
      'mousemove': 'drag',
      'mousedown': 'mouseDown',
      'mouseup': 'mouseUp'
    },

    initialize: function() {
      _.bindAll(this, 'setOffset');

      this.emptyWidget = new EmptyWidgetView({
        parent: this.$el
      });

      $(window).resize(this.setOffset);

      this.populate();
      this.attach();

      this.listenTo(dashboards, 'change:selectedDashboard', this.attach)
        .listenTo(this.model.widgets, {
          'add': this.addWidget,
          'remove': this.removeWidget
        })
        .listenTo(this.model, 'destroy', this.destroyed);
    },

    destroyed: function() {
      this.remove();
    },

    /**
     * Add a widget to the current dashboard.
     * @param {WidgetModel}  widget Backbone model of the widget.
     */
    addWidget: function(widget) {
      // Remove '+' placeholder for adding widgets
      this.emptyWidget.detach();

      var newWidget = new WidgetView({
        model: widget,
        parent: this.$el
      });

      newWidget.on('drag', this.setDragTarget, this);
      if (widget.newlyCreated === true) {
        // Add a glowing effect on the widget to highlight it
        // Remove it after 5s
        newWidget.$el.addClass('new');
        setTimeout(function() {
          newWidget.$el.removeClass('new');
        }, 5000);
      }
    },

    removeWidget: function(widget) {
      if (this.model.widgets.length === 0) {
        this.emptyWidget.attach();
      }
    },

    populate: function() {
      if (this.model.widgets.length) {
        this.model.widgets.each(this.addWidget, this);
      } else {
        this.emptyWidget.attach();
      }
    },

    attach: function() {
      this.$el.hide();
      $('header').after(this.$el);

      if (dashboards.get('selectedDashboard') === this.model.id) {
        this.$el.show();
        this.setOffset();
      }
    },

    drag: function(event) {
      if (!this.dragger) {
        return true;
      }

      var model = this.dragger.model,
        newX = Math.floor((event.pageX - this.position_x) / widgetOffset) + 1,
        newY = Math.floor((event.pageY - this.position_y) / widgetOffset) + 1;

      if ((newX !== model.get('position_x')) && ((newX + parseInt(model.get('width'), 10)) <= columns)) {
        model.set('position_x', newX);
      }
      if ((newY !== model.get('position_y')) && ((newY + parseInt(model.get('height'), 10)) <= rows)) {
        model.set('position_y', newY);
      }

      return false;
    },

    mouseDown: function() {
      // prevent text selection
      return false;
    },

    mouseUp: function() {
      if (this.dragger) {
        this.dragger.trigger('stopDrag');
        delete this.dragger;
      }
    },

    setDragTarget: function(target) {
      this.dragger = target;
      this.dragger.trigger('startDrag');
    },

    setOffset: function(event) {
      // TODO finish this
      if (!event) {
        var offset = this.$el.offset();
        this.position_x = offset.left;
        this.position_y = offset.top;
      }
    }
  });
});
