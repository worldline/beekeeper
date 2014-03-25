define(['backbone', 'underscore', 'config'], function(Backbone, _, config) {
  return Backbone.Model.extend({
    defaults: {
      name: 'Widget',
      position_x: 0,
      position_y: 0,
      width: 1,
      height: 1,
      type: ''
    },
    idAttribute: '_id',
    urlRoot: config.apiUrl + '/user/me/widgets',

    initialize: function() {
      // User interaction while moving widget across places might be a bit slow
      // Do not attempt to save more than necessary
      // NOTE: saving too often seems to crash Chrome...
      var self = this, debouncedSave = _.debounce(function() {
        self.save();
      }, 1000);

      this.on('change:position_x change:position_y', debouncedSave);
      this.isDragged = false;
    },

    startDrag: function() {
      this.isDragged = true;
    },

    stopDrag: function() {
      this.isDragged = false;
    },

    getClass: function() {
      return 'widget w' + this.get('width') + ' h' + this.get('height') + ' t' + this.get('position_y') + ' l' + this.get('position_x') + ' ' + (this.isDragged ? 'dragged' : '');
    }
  });
});
