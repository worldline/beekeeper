define(['jquery', 'backbone', 'hbs!./template', './selection/search/view', './selection/list/view', './selection/tree/model', './configure/view'], function($, Backbone, template, SearchSelectionView, SelectionListView, SelectionTreeModel, ConfigureView) {
  return Backbone.View.extend({
    className: 'panel pleft',

    events: {
      "click .handle": "onClickHandle",
      "toggle": "onClickHandle"
    },

    initialize: function() {
      this.render();
      this.populate();
      this.attach();

      this.configureView.show();

    },

    render: function() {
      this.$el.html(template());
      return this;
    },

    populate: function() {

      var selectionTreeModel = new SelectionTreeModel();

      this.searchSelection = new SearchSelectionView({
        model: selectionTreeModel,
        className: 'searchSelection',
        parent: this.$el,
        panelView: this
      });

      this.selectionList = new SelectionListView({
        className: 'selectionList',
        parent: this.$el,
        panelView: this
      });


      this.configureView = new ConfigureView({
        className: 'configureScreen',
        parent: this.$el,
        panelView: this
      });

      this.searchSelection.consume = this.selectionList.addItem;
      this.configureView.consume = this.selectionList.addItem;

      this.configureView.hide();

      this.configureView.childOfList = this.selectionList.items;
    },

    attach: function() {
      $('.mainContainer').after(this.$el);
    },

    onClickHandle: function() {
      this.$el.toggleClass("active");

      if (this.$el.hasClass("active")) {
        this.configureView.takeFocus();
        Backbone.trigger('panel', {
          state: 'active',
          panel: 'left'
        });
      }
    },

    giveFocus: function() {
      this.$el.addClass("active");
      this.configureView.takeFocus();
      Backbone.trigger('panel', {
        state: 'active',
        panel: 'left'
      });
    },
    takeFocus: function() {
      this.$el.removeClass("active");
    }
  });
});