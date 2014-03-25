define(['backbone', 'user/model', 'hbs!./template', 'header/tabbar/view', 'panelLeft/view', 'panelRight/view', 'header/login/view'], function (Backbone, user, homeTemplate, DashboardTabsView, PanelLeftView, PanelRightView, LoginMenuView) {
  return Backbone.View.extend({
    el: '.mainContainer',

    events: {
      'click #updatePassword': 'onUpdatePasswordHandle',
    },

    initialize: function () {
      this.render();
    },

    render: function () {
      this.$el.html(homeTemplate());

      this.dashboardTabs = new DashboardTabsView();
      this.loginMenu = new LoginMenuView();
      this.panelRight = new PanelRightView();
      this.panelLeft = new PanelLeftView();
    },

    forcePanel: function (panel) {
      switch (panel) {
        case 'left':
          this.panelLeft.giveFocus();
          this.panelRight.takeFocus();
          break;
        case 'right':
          this.panelRight.giveFocus();
          this.panelLeft.takeFocus();
          break;
        case 'none':
          break;
        default:
          this.panelRight.takeFocus();
          this.panelLeft.takeFocus();
      }
    },

    onUpdatePasswordHandle: function () {
      $('.modal').modal('hide');
      var modal = $('#bkUpdatePasswordModal')
        , body = modal.find('.modal-body');
      modal.modal('hide');
      // reset fields
      body.find('input').val('');
      body.find('input').removeClass('failed');

      modal.find('.btn-primary').click(function (e) {
        e.preventDefault();
        body.find('input').removeClass('failed');
        var oldP = body.find("[name='oldpassword']")
          , newP = body.find("[name='newpassword']")
          , confP = body.find("[name='confirmpassword']");
        if (oldP.val() === '') {
          oldP.addClass('failed');
          return;
        }
        if (newP.val() === '') {
          newP.addClass('failed');
          return;
        }
        if (confP.val() === '') {
          confP.addClass('failed');
          return;
        }
        if (newP.val() !== confP.val()) {
          newP.addClass('failed');
          confP.addClass('failed');
          return;
        }
        if (newP.val() === oldP.val()) {
          newP.addClass('failed');
          newP.val("");
          confP.val('');
          return;
        }
        user.updatePassword(oldP.val(), newP.val(), function (err) {
          if (err) {
            if (err) {
              var message = err.responseText;
              console.log(err);
              if (message.indexOf('bad oldpassword') !== -1) {
                oldP.addClass('failed');
                oldP.val("");
              } else if (message.indexOf('newpassword must be at least 5 characters long') !== -1) {
                newP.addClass('failed');
                newP.val("");
                confP.val('');
              }
              return;
            }
            return;
          }
          modal.modal('hide');
        });
      });
      modal.modal('show');
    },
  });
});
