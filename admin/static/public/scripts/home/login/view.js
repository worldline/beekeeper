define(['jquery', 'backbone', 'hbs!./template', 'user/model'], function($, Backbone, template, user) {

  return Backbone.View.extend({
    className: 'loginScreen',

    events: {
      'submit .loginPrompt': 'validate'
    },

    initialize: function() {
      var succeeded = false,
        self = this,
        messages = {
          failed: 'Login failed, please try again',
          error: 'An error occured, please try again',
          initError: 'An error occured, please try to log in'
        };

      user.on('authentication', function(state) {
        var prompt, submit;

        prompt = self.$('.loginPrompt');

        if (state === 'needed') {
          self.$el.removeClass('valid');

          prompt.delay(succeeded ? 2000 : 0).show(succeeded ? 0 : 200, function() {
            succeeded = false;
            prompt.find('input[name=username]').focus();
          });

        } else if (state === 'success') {
          succeeded = true;
          prompt.find('input[type!=submit]').val('');

          prompt.hide(200, function() {
            require('router').navigate('back', true);
            self.$el.addClass('valid');
          });

        } else {
          submit = prompt.find('input[type=submit]');
          submit.val(messages[state]).addClass('failed');

          self.$el.one('focus keypress', 'input', function() {
            submit.val('ok').removeClass('failed');
          });
        }
      });

      this.populate();
      this.attach();
      user.loadInitalValue();
    },

    populate: function() {
      this.$el.html(template());
      this.$('.loginPrompt').append($("#loginPromptPlaceHolder>form")).hide();
    },

    attach: function() {
      $('body').append(this.$el);
    },

    validate: function() {
      user.login(this.$('input[name=username]').val(), this.$('input[name=password]').val());
      return false;
    }
  });
});