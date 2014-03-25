var security = require('./controllers/security'),
  apikeyController = require('./controllers/apikey'),
  dashboardsControllers = require('./controllers/dashboards'),
  widgetsControllers = require('./controllers/widgets'),
  hierarchyControllers = require('./controllers/hierarchy'),
  keysControllers = require('./controllers/keys'),
  errorsControllers = require('./controllers/errors')

exports.addRoutes = function (app) {

  app.get('/', function (req, res) {
    // TODO: do something useful there
    res.send('Welcome on Beekeeper API server.');
  });

  app.post('/errors', errorsControllers.create);

  // apikey routes
  app.namespace('/apikey', function () {
    app.post('/', apikeyController.createApikey);
    app.get('/isNoApiKeyAllowed', apikeyController.isNoApiKeyAllowed);
    app.get('/:apikey', apikeyController.getApikey);
    app.del('/:apikey', apikeyController.deleteApikey);
  });

  // Security routes
  app.namespace('/user', function () {

    app.namespace('/me', function () {
      app.get('/', security.me);
      app.put('/password', security.updatePassword);

      app.namespace('/dashboards', function () {
        app.get('/', security.ensureAuthenticated, dashboardsControllers.getFullDashboards);
        app.post('/', security.ensureAuthenticated, dashboardsControllers.updateSelectedDashboard);

        app.namespace('/dashboard', function () {
          app.post('/', security.ensureAuthenticated, dashboardsControllers.createDashboard);
          app.put('/:id', security.ensureAuthenticated, dashboardsControllers.updateDashboard);
          app.del('/:id', security.ensureAuthenticated, dashboardsControllers.deleteDashboard);
        });

      });

      app.namespace('/widgets', function () {
        app.get('/', security.ensureAuthenticated, widgetsControllers.listWidgets);
        app.post('/', security.ensureAuthenticated, widgetsControllers.createWidgets);
        app.put('/:id', security.ensureAuthenticated, widgetsControllers.updateWidgets);
        app.del('/:id', security.ensureAuthenticated, widgetsControllers.deleteWidgets);
      });

    })

    app.post('/login', security.login);
    app.get('/logout', security.logout);

  });

  app.namespace('/hierarchy', function () {
    app.get('/', hierarchyControllers.getRoots);
    app.get('/:id', hierarchyControllers.getNodeById);
    app.post('/trees', hierarchyControllers.getFullParentsTrees);
    app.get('/:id/children', hierarchyControllers.getChildrenByParentId);
    app.get('/:id/child/:name', hierarchyControllers.getNodeByNameAndParentId);
  });

  app.namespace('/types', function () {
    app.get('/', keysControllers.listTypes);
    app.get('/:type/keys', keysControllers.keysForType);
  });

}
