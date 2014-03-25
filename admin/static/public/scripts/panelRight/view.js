define(['jquery', 'backbone', 'hbs!./template'], function($, Backbone, template) {
  return Backbone.View.extend({
    className: 'panel pright',
    events: {
      'click .handle': 'onClickHandle',
    },

    initialize: function() {
      this.render();
      this.attach();
    },

    render: function() {
      this.$el.html(template());
      return this;
    },

    attach: function() {
      $('.mainContainer').after(this.$el);
    },

    onClickHandle: function() {
      this.$el.toggleClass('active');
      if (this.$el.hasClass("active")) {
        Backbone.trigger('panel', {
          state: 'active',
          panel: 'right'
        });
      }
    },

    giveFocus: function() {
      Backbone.trigger('panel', {
        state: 'active',
        panel: 'right'
      });
      this.$el.addClass("active");
    },
    takeFocus: function() {
      this.$el.removeClass("active");
    }
  });
});