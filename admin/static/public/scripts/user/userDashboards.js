define(['underscore', 'backbone', 'dashboard/model', 'config', 'notify'], function(_, Backbone, DashboardModel, config, notify) {
  var DashboardCollection, UserDashboardsModel;

  DashboardCollection = Backbone.Collection.extend({
    model: DashboardModel
  });

  UserDashboardsModel = Backbone.Model.extend({
    /**
     * Properties
     */
    url: config.apiUrl + '/user/me/dashboards',

    initialize: function() {
      this.set('dashboards', new DashboardCollection());

      this.on('change:selectedDashboard', function() {
        this.save();
      });
    },

    parse: function(data) {
      if (data) {
        this.get('dashboards').reset(data.dashboards, {
          parse: true
        });

        // We don't want Backbone to takeover the `dashboards` property with this array
        delete data.dashboards;
      }

      return data;
    },

    /**
     * Adds a new dashboard to the collection.
     * @param {Object}   attributes (ex: { name: 'dashboard name' }). See Dashboard model for more attributes.
     * @param {Function} callback
     */
    addDashboard: function(attributes, callback) {
      var newDashboard = new DashboardModel(attributes),
        dashboards = this.get('dashboards'),
        xhrOptions;

      dashboards.push(newDashboard);

      if (callback) {
        xhrOptions = {
          error: function() {
            callback(true);
          },
          success: function(model) {
            callback(null, model);
          }
        };
      }

      newDashboard.save(null, xhrOptions);
      return newDashboard;
    },

    /**
     * Create a brand new widget-free dashboard
     * @param  {String} name
     * @return {Dashboard}
     */
    createEmptyDashboard: function(name) {
      var self = this,
        dashboards = this.get('dashboards'),
        newDashboard = this.addDashboard({
          // If no name is provided, name it `Dashboard {Number of dashboards}`
          name: name || ('Dashboard ' + (dashboards.length + 1))
        }, function(err) {
          if (err) {
            return notify({
              title: 'Error',
              body: "An error happened while creating a new empty dashboard. Please refresh the page"
            });
          }

          self.set('selectedDashboard', newDashboard.id);
        });

      return newDashboard;
    },

    removeCurrentDashboard: function() {
      var self = this,
        dashboards = self.get('dashboards'),
        selectedIndex = self.findIndexOfSelected();

      if (selectedIndex === -1) {
        return; // Trying to remove something that doesn't exist
      }

      // Destroy both removes from the server and the collection
      dashboards.at(selectedIndex).destroy({
        success: function () {
          if (!dashboards.length) {
            // Dashboard is empty, we need to create a default dashboard
            self.createEmptyDashboard();
          } else {
            // Attempt to select the new dashboard at the same position
            // or if not found the previous one.
            self.set('selectedDashboard', (dashboards.at(selectedIndex) || dashboards.at(selectedIndex - 1)).id);
          }
        }
      });
    },

    /**
     * Returns the index of the currently selected dashboard
     * @return {Number}
     */
    findIndexOfSelected: function() {
      var selected = this.getSelected();

      if (!selected) {
        return -1;
      }

      return this.get('dashboards').indexOf(selected);
    },

    getSelected: function() {
      var selected = this.get('selectedDashboard'),
        dashboards = this.get('dashboards');

      if (!selected || !dashboards) {
        return;
      }

      return dashboards.get(selected);
    }
  });

  return new UserDashboardsModel();
});
