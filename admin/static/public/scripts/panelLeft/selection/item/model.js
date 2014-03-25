define(['backbone'], function(Backbone) {

  return Backbone.Model.extend({
    initialize: function() {
      var selection = {}, selected = {
        geographic: {
          container: '',
          content: ''
        },
        logic: {
          container: '',
          content: ''
        },
        type: {
          container: '',
          content: ''
        }
      };

      this.get('selection').forEach(function(axis) {
        selection[axis.name] = axis;
      });

      this.set({
        selected: selected
      });

      function scrap(level, axisName) {
        if (!level.sublevels) {
          return false;
        }

        if (level.sublevels.list.length > 1) {
          selected[axisName].container = level.name;
          if (level.sublevels.list.length === level.sublevels.total) {
            selected[axisName].content = 'all selected';
          } else if (level.sublevels.list.length >= 4) {
            selected[axisName].content = level.sublevels.list.length + ' selected';
          } else {
            var levelsId = [];
            level.sublevels.list.forEach(function(level) {
              levelsId.push(level.name);
            })
            selected[axisName].content = levelsId.join(', ');
          }

        } else {
          if (!scrap(level.sublevels.list[0], axisName)) {
            selected[axisName].container = level.name;
            selected[axisName].content = level.sublevels.list[0].name;

          }
        }

        return true;
      }

      Object.keys(selected).forEach(function(axisName) {
        if (selection[axisName]) {
          scrap(selection[axisName], axisName);
        } else {
          selected[axisName].container = axisName;
          selected[axisName].content = 'all';
        }
      })
    }
  });
});