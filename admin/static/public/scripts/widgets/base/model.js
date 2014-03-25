define(['underscore', 'backbone', 'interface/cube', 'd3', 'moment'], function(_, Backbone, CubeInterface, d3, moment) {

  function defaultTimeScaleFormatter(d) {
    return moment(d).format('L');
  }

  function minuteFormatter(d) {
    return moment(d).format('LT');
  }

  function monthFormatter(d) {
    return moment(d).format('MMMM');
  }

  function yearFormatter(d) {
    return moment(d).format('YYYY');
  }

  function defaultTimeTooltipFormatter(d) {
    return moment(d).format('LLLL');
  }

  function dayFormatter(d) {
    return moment(d).format('LL');
  }

  var timeScaleFormatterScale = d3.scale.threshold()
    .domain([
      3600e3, // 1 hour
      2678400e3, // 1 month
      32140800e3 // 1 year
    ])
    .range([
      minuteFormatter,
      defaultTimeScaleFormatter,
      monthFormatter,
      yearFormatter
    ]);

  var timeTooltipFormatterScale = d3.scale.threshold()
    .domain([
      86400e3, // 1 day
      2678400e3, // 1 month
      32140800e3 // 1 year
    ])
    .range([
      defaultTimeTooltipFormatter,
      dayFormatter,
      monthFormatter,
      yearFormatter
    ]);

  return Backbone.Model.extend({
    constructor: function(attributes, options) {
      var self = this;
      var formulas = options.parent.get('formulas');
      self.parentId = options.parent.cid;

      if (self.normalizeLimits) {
        self.maxWidth = _.min(formulas, 'limit').limit;
      }

      if (self.limitDataToMaxWidth) {
        self.maxWidth = _.min([self.maxWidth || Infinity, options.parent.get('width') * 120 - 18]);
      }

      self.formulas = _.map(formulas, self.transformFormula, self);

      var maxStepItem = _.max(self.formulas, 'step');
      self.timeScaleFormatter = defaultTimeScaleFormatter;
      self.timeTooltipFormatter = defaultTimeTooltipFormatter;
      if (maxStepItem && maxStepItem.step) {
        self.timeScaleFormatter = timeScaleFormatterScale(maxStepItem.step);
        self.timeTooltipFormatter = timeTooltipFormatterScale(maxStepItem.step);
      }

      self.cube = new CubeInterface({
        id: self.parentId,
        formulas: self.formulas,
        callback: self.onData.bind(self)
      });

      self.render = _.debounce(function() {
        self.trigger('render');
      }, 500);

      Backbone.Model.apply(self, arguments);

      self.listenTo(self, {
        destroy: self.destroyed
      });
    },

    destroyed: function() {
      this.cube.unsubscribe();
    },

    transformFormula: function(formula) {
      return {
        id: {
          name: formula.name,
          position: formula.position,
          type: formula.type,
          parent: this.parentId
        },
        step: formula.step,
        limit: this.maxWidth || formula.limit,
        kind: formula.kind,
        expression: formula.expression
      };
    },

    onData: function(data) {
      throw new Exception('You must implement onData in your widget model.');
    },

    pull: function() {
      this.cube.connect();
    }
  });
});
