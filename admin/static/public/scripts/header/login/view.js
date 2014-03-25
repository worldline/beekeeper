define(['backbone', 'user/model'], function(Backbone, user) {
  return Backbone.View.extend({
    el: '.login',

    initialize: function() {
      this.render();
    },

    render: function() {
      this.$('.name').html(user.get('username'));
    }
  });
});
