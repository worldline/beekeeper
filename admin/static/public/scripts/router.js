define(['backbone', 'underscore', 'home/view', 'home/login/view', 'user/userDashboards', 'user/model'], function(Backbone, _, HomeView, LoginScreenView, userDashboards, user) {
  var router, Router = Backbone.Router.extend({
    routes: {
      'dashboard': 'loadDashboard',
      'dashboard/:order': 'loadDashboardByOrder',
      'logout': 'logout',
      'back': 'goback',
      'panel/:panel': 'forcePanel',
      '': 'defaultRoute',
      ':default': 'defaultRoute'
    },

    /**
     * Given a left or right panel, force its focus.
     * @param  {String} panel `left`, `right`, or anything else for none.
     */
    forcePanel: function(panel) {
      var self = this;

      function showPanel() {
        self.homeView.forcePanel(panel);
      }

      self.loadDashboard(showPanel);
    },

    goback: function() {
      var dest = this.back || 'dashboard';
      this.back = '';
      this.navigate(dest, true);
    },

    defaultRoute: function() {
      this.navigate('dashboard', true);
    },

    loadDashboard: function(cb) {
      var self = this;
      if (!user || !user.get('username')) {
        // Reset the URL in case we are not logged in
        return self.navigate('login');
      }

      // If the dashboards are already loaded, use the callback
      if (userDashboards.get('_id')) {
        if (cb) {
          cb();
        }
        return;
      }

      userDashboards.fetch({
        success: function() {
          self.createSubViews();
          if (userDashboards.get('dashboards').length === 0) {
            userDashboards.createEmptyDashboard();
          } else {
            self.loadSelectedDashboard();
          }

          if (cb) {
            cb();
          }
        }
      });
    },

    loadSelectedDashboard: function() {
      this.setDashboard(userDashboards.findIndexOfSelected() + 1);
    },

    loadDashboardByOrder: function(order) {
      var self = this;
      self.loadDashboard(function() {
        self.setDashboard(order);
      });
    },

    setDashboard: function(order) {
      var dashboards = userDashboards.get('dashboards'),
        dashboard = dashboards.at(order - 1);

      if (dashboard) {
        userDashboards.set('selectedDashboard', dashboard.id);
        this.navigate('dashboard/' + order);
      } else {
        this.navigate('dashboard/1', true);
      }
    },

    initialize: function() {
      var self = this;
      Backbone.on('panel', function(state) {
        if (state.state === 'active') {
          router.navigate('/panel/' + state.panel);
        }
      });

      userDashboards.on('change:selectedDashboard', function() {
        self.navigate('dashboard/' + (userDashboards.findIndexOfSelected() + 1), true);
      });
    },

    appStart: function() {
      this.loginScreenView = new LoginScreenView();
    },

    createSubViews: function() {
      this.homeView = new HomeView();
    },

    logout: function() {
      var self = this;
      user.logout(function() {
        self.navigate('login');
        document.location.reload(); // TODO: that's a hard way to clean the state, do better
      });
    }
  });

  router = new Router();
  router.back = window.location.hash;

  Backbone.history.start({
    pushState: false
  });

  return router;
});
