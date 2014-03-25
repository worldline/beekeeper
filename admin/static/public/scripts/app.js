define(['backbone', 'underscore', 'router', 'config', 'logger'], function(Backbone, _, router, config) {
  return _.extend({
    router: router,
    config: config
  }, Backbone.Events);
});
