define(['underscore', 'backbone', 'user/userDashboards', 'hbs!./template', 'dashboard/view', 'dropdown', 'rename'], function(_, Backbone, userDashboards, tabTemplate, DashboardView) {

  return Backbone.View.extend({
    el: '.nav-tabs',

    events: {
      'click .dashboard': 'clickOnTab',

      'dblclick .active [data-editable]': 'rename',

      'click [data-rename-dashboard]': 'rename',
      'click [data-delete-dashboard]': 'remove',
      'click [data-create-dashboard]': 'create',

      'click [data-create-widget]': 'createWidget'
    },

    initialize: function() {
      this.populate();
      this.render();

      this.listenTo(userDashboards, 'change:selectedDashboard', this.render);
      this.listenTo(userDashboards.get('dashboards'), {
        'add': this.addDashboard,
        'remove': this.render
      });
    },

    populate: function() {
      userDashboards.get('dashboards').forEach(this.addDashboard, this);
    },

    clickOnTab: function(event) {
      // 'simulate' the click to its real destination, the <a href=...
      $(event.target).children('a').each(function() {
        window.location.href = this;
      });
    },

    render: function() {
      // Flush present tabs
      this.$('.dashboard').remove();

      var selectedDashboard = userDashboards.get('selectedDashboard');
      this.$('.newDash').before(userDashboards.get('dashboards').map(function(dashboard, index) {
        var modelId = dashboard.get('_id');

        return tabTemplate({
          dashboardName: dashboard.get('name'),
          dashboardID: modelId,
          active: selectedDashboard === modelId ? 'active' : null,
          order: index + 1
        });
      }));
    },

    rename: function() {
      var selectedTab = this.$('.active'),
        selectedDashboard = userDashboards.getSelected();

      // Call jquery rename plugin
      selectedTab.rename(function(newName) {
        selectedTab.attr('title', newName);
        selectedDashboard.save({
          'name': newName
        });
      });
    },

    addDashboard: function(dashboard) {
      new DashboardView({ model: dashboard });
    },

    remove: function() {
      userDashboards.removeCurrentDashboard();
    },

    create: function() {
      userDashboards.createEmptyDashboard();
    },

    createWidget: function() {
      // Toggle left panel visibility
      Backbone.trigger('widget:new', this);
    }
  });
});
