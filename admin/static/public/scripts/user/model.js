define(['backbone', 'config'], function (Backbone, config) {
  var LoggedUser = Backbone.Model.extend({
    /**
     * Properties
     */
    urlRoot: config.apiUrl + '/user',
    url: function () {
      return this.urlRoot + '/me';
    },
    loginUrl: function () {
      return this.urlRoot + '/login';
    },
    logoutUrl: function () {
      return this.urlRoot + '/logout';
    },
    updatePasswordUrl: function () {
      return this.urlRoot + '/me/password';
    },

    initialize: function () {
      $.ajaxPrefilter(function (options) {
        options.xhrFields = {
          withCredentials: true
        };
      });

      // On any error, clear the object
      this.on('error', function (xhr) {
        if (xhr.status >= 400 && xhr.status < 500) {
          //authentication failed
          this.trigger('authentication', 'failed', this);
        } else {
          //An unknow error occured, probably network or server
          this.trigger('authentication', 'error', this);
        }
      });
    },

    /**
     * This method's role is to check whether we're already logged in through the cookie.
     * If so, the model will be stored an the app can continue, if not, the login panel will be shown.
     */
    loadInitalValue: function () {
      var self = this;
      self.fetch({
        success: function () {
          self.trigger('authentication', 'success');
        },
        error: function (originalModel, resp) {
          var message = resp.responseText ? JSON.parse(resp.responseText) : null;
          self.trigger('authentication', 'needed');

          // There was an error we didn't expect, we ought to signal it
          if (!message || message.message !== 'Not authenticated') {
            self.trigger('authentication', 'initError');
          }
        }
      });
    },

    login: function (username, password) {
      var self = this;
      return $.ajax({
        url: self.loginUrl(),
        type: 'POST',
        dataType: 'json',
        data: {
          username: username,
          password: password
        },
        success: function (data) {
          self.set(data); // The whole user is stored in the model, might prove useful
          self.trigger('authentication', 'success', self); // Publish the event we're logged in
        },
        error: function (xhr) {
          // The error is triggered to be caught by the listener up in the `initialize`
          self.trigger('error', xhr);
        }
      });
    },

    logout: function (cb) {
      var self = this;
      return $.ajax({
        url: self.logoutUrl(),
        success: function () {
          self.clear(); // Clear the model from any authentication information it may contain
          if (cb) {
            cb();
          }
        },
        error: function (xhr) {
          // The error is triggered to be caught by the listener up in the `initialize`
          self.trigger('error', xhr);
        }
      });
    },

    updatePassword: function (oldPassword, newPassword, cb) {
      var self = this;
      return $.ajax({
        url: self.updatePasswordUrl(),
        type: 'PUT',
        dataType: 'json',
        data: {
          oldpassword: oldPassword,
          newpassword: newPassword
        },
        success: function (data) {
          self.trigger('passwordupdate', 'success', self); // Publish the event we're logged in
          if (cb) {
            cb();
          }
        },
        error: function (xhr) {
          // The error is triggered to be caught by the listener up in the `initialize`
          self.trigger('error', xhr);
          if (cb) {
            cb(xhr);
          }
        }
      });
    }
  });

  return new LoggedUser();
});
