define(['jquery', 'underscore', 'backbone', 'hbs!./template', 'hbs!./fields/template', 'hbs!./elements/template', 'widgets/model', 'user/userDashboards', 'config', './formulaCleaner', 'notify', './autocompletionHelper', 'widgets/list'], function($, _, Backbone, template, fieldsTemplate, formulaTemplate, Widget, userDashboards, config, cleanFormula, notify, autocompletionHelper, widgetList) {
  return Backbone.View.extend({
    events: {
      'change .widgetSelect': 'shouldUpdatePreview',
      'click .button.create': 'submitWidget',
      'click .button.edit': 'submitWidget',
      'click .button.cancel': 'cancelConfiguration'
    },

    widgets: widgetList.map(function(name) { return { name: name }}),

    initialize: function(options) {
      var self = this;
      this.$parent = options.parent;
      this.$parent.find('.selectionList').prepend(this.$el);
      this.childOfList = [];
      this.types = [];

      // Handle edit event from the main view
      Backbone.on('widget:edit', this.launchEdition, this);

      // Handle widget creation from the big `+` button or dashboard contextual menu
      Backbone.on('widget:new', function() {
        self.$parent.trigger('toggle');
        self.render();
      });

      Backbone.on('widget:created', function () {
        // Toggle the panel and show the dashboard
        self.$parent.trigger('toggle');
      });

      Backbone.on('widget:create-error', function () {
        notify({
          title: 'Error',
          body: "Error during the widget creation, please try again"
        });
      });

      // Populate meta-information about known collections (cpu, memory, ...)
      $.ajax({
        url: config.apiUrl + '/types',
        dataType: 'json',
        success: function(data) {
          if (data && data.results) {
            self.types = data.results;
          }
        }
      });
    },

    takeFocus: function() {
      this.$('.preview input').focus();
    },

    render: function() {
      this.$el.html(template({
        widgets: this.widgets
      }));

      this.$('img').hide().first().show();
      this.updatePreview();
      return this;
    },

    hide: function() {
      this.$el.hide();
    },

    show: function() {
      this.$el.show();
      this.render();
      this.$('.preview input').focus();
    },

    shouldUpdatePreview: function() {
      return this.updatePreview();
    },

    setFormulaDefaults: function(widget, fields) {
      fields.forEach(function(field) {
        var defaultProperty;

        field.refresh = [{
          name: '10s',
          value: 10
        }, {
          name: '1mn',
          value: 60
        }, {
          name: '5mn',
          value: 300
        }, {
          name: '1h',
          value: 3600
        }, {
          name: '1d',
          value: 86400
        }, {
          name: '1w',
          value: 604800
        }, {
          name: '1mth',
          value: 2678400
        }];

        if (field.properties && (defaultProperty = field.properties['default']) && defaultProperty.refresh) {
          field.refresh.forEach(function(refresh) {
            if (refresh.value === defaultProperty.refresh) {
              refresh['default'] = true;
            }
          });
        }

        if (typeof field.properties.modifiers === 'function') {
          field.properties.modifiers = field.properties.modifiers();
        }
      });

      //set the default modifier
      if (widget) {
        fields.forEach(function(field) {
          if (field.properties.modifiers) {
            field.properties.modifiers.forEach(function(el) {
              delete el['default'];
              if (widget.formulas) {
                if (_.some(widget.formulas, function(formula) {
                  return formula.position === field.name && formula.type === el.name;
                })) {
                  el['default'] = true;
                }
              }
            });
          }

          if (widget.formulas) {
            widget.formulas.forEach(function(formula) {
              if (field.name === formula.position) {
                var defaultProperty = field.properties['default'] = field.properties['default'] || {};
                defaultProperty.name = formula.name;
                defaultProperty.period = formula.step * formula.limit / 1000;

                field.refresh.forEach(function(refresh) {
                  if (refresh.value === formula.step / 1000) {
                    refresh['default'] = true;
                  }
                });
              }
            });
          }
        });
      } else {
        widget = {};
      }
      return widget;
    },

    updatePreview: function(widget) {
      var self = this,
        selected = self.$('.widgetSelect').val();
      self.$('img').hide();
      self.$('img.' + selected).show();

      self.$('.preview').removeClass().addClass('preview ' + selected);
      self.$('.preview input').focus();
      require(['widgets/' + selected + '/index'], function(widgetElements) {
        var parsedDesc = widgetElements.desc;
        self.$('.description').text(parsedDesc.desc || '');

        widget = self.setFormulaDefaults(widget, parsedDesc.formulas.fields);

        self.$('.fields').html(fieldsTemplate(parsedDesc));

        parsedDesc.formulas.elements = _.map(parsedDesc.formulas.elements, function(el) {
          return {
            el: el.el || el,
            in : _.map(self.childOfList, function(el, index) {
              return {
                value: index,
                name: '#' + (+index + 1)
              };
            })
          };
        });

        self.$('.formulas').html(formulaTemplate(parsedDesc.formulas));

        parsedDesc.dimensions = parsedDesc.dimensions || {
          width: {},
          height: {}
        };
        self.$('.dimensions select[name=width]').val(widget.width || parsedDesc.dimensions.width['default'] || 1);
        self.$('.dimensions select[name=height]').val(widget.height || parsedDesc.dimensions.height['default'] || 1);

        ['height', 'width'].forEach(function ajustDimension(dim) {
          self.$('.dimensions [name=' + dim + '] option').each(function(index, el) {
            var $el = $(el);
            if (parsedDesc.dimensions[dim].maximum && +$el.val() > parsedDesc.dimensions[dim].maximum) {
              $el.attr('disabled', 'disabled');
            } else {
              $el.removeAttr('disabled');
            }
          });
        });

        autocompletionHelper(self.$('textarea.tagged_text'), self.childOfList, self.types);
      });
    },

    extractSelectedHierarchy: function(selection) {
      var root = selection.model.attributes.selection;

      function subLevel(el) {
        var flattenSublevels = [];
        if (el.sublevels && el.sublevels.list) {
          _.each(el.sublevels.list, function(el) {
            flattenSublevels.push.apply(flattenSublevels, subLevel(el));
          });
          return flattenSublevels;
        }
        return [{
          id: el.id
        }];
      }

      return _.map(root, subLevel);
    },

    extractFieldsSettings: function(selections) {
      var self = this;
      return self.$(".fields li").map(function(index, element) {
        var $element = $(element),
          formula = {
            position: $element.find("input.name").attr("name"),
            name: $element.find("input.name").val(),
            type: $element.find("select[name=type]").val()
          };

        // Substitute each #<number> with its hierarchy ids equivalent in each formula
        self.$(".formula").each(function(i, f) {
          var $v = $(f).find("textarea"),
            elementName = $v.attr("name"),
            toReplace = {}, childOfs;

          formula[elementName] = $v.val();
          childOfs = formula[elementName].match(/#[0-9]+/g);
          if (childOfs && childOfs.length > 0) {
            childOfs.forEach(function(el) {
              var val = +el.substr(1),
                hierarchyIds = selections[val - 1];
              toReplace[el] = JSON.stringify(hierarchyIds);
            });
            Object.keys(toReplace).forEach(function(el) {
              formula[elementName] = formula[elementName].replace(new RegExp(el, "g"), toReplace[el]);
            });
          }
        });
        formula.refresh = $element.find("select[name=refresh]").val() || 10;
        formula.width = $element.find("input[name=width]").val() || 10;
        formula.maxWarningThreshold = 800;
        formula.maxErrorThreshold = 900;
        return formula;
      });
    },

    computeFormula: function(widget, selections, callback) {
      require(['widgets/' + widget.type + '/index'], function(widgetElements) {
        widget.formulas = widgetElements.computeFormula.compute(widget.formulas, selections);
        callback();
      });
    },

    submitWidget: function(event) {
      var self = this,
        selections = _.map(self.childOfList, self.extractSelectedHierarchy), // Extract all selected Ids from each #<number>
        isEdition = $(event.target).hasClass('edit'),
        widget = {
          type: self.$('.widgetSelect').val(),
          dashboard: userDashboards.get('selectedDashboard'),
          name: self.$('input[name=title]').val() || 'new widget',
          formulas: this.extractFieldsSettings(selections),
          width: +self.$('.dimensions select[name=width]').val(),
          height: +self.$('.dimensions select[name=height]').val(),
          position_x: +self.$('input[name=position_x]').val() || 1,
          position_y: +self.$('input[name=position_y]').val() || 1
        };

      this.computeFormula(widget, selections, function() {
        if (isEdition) {
          widget._id = self.$('input[name=widgetID]').val();
        }

        Backbone.trigger('widget:save', widget);
      });
    },

    cancelConfiguration: function() {
      this.render();
    },

    launchEdition: function(widgetView) {
      // show panel
      var self = this,
        widgets = self.widgets,
        widget = widgetView.model,
        widgetType = widget.get('type'),
        formulas = widget.get('formulas');

      self.$('.mainparams .widgetSelect').val(widgetType);

      widgets.forEach(function(el) {
        if (el.name === widgetType) {
          el['default'] = true;
        } else {
          delete el['default'];
        }
      });

      // we should Re-render for the edit button
      self.$el.html(template({
        widgets: widgets,
        widget: widget.attributes
      }));

      self.updatePreview(widget.attributes);

      require(['widgets/' + widgetType + '/index'], function(widgetElements) {
        var elements = widgetElements.computeFormula.explode(formulas);
        // we also need to replace the childOf stuff
        Object.keys(elements).forEach(function(el) {
          cleanFormula(elements[el], self, function(content) {
            self.$('.formula textarea[name=' + el + ']').val(content);
          });
        });
        self.$parent.trigger('toggle');
      });
    }
  });
});
