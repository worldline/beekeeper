define(['jquery', 'backbone', 'd3', 'underscore', 'hbs!./tooltip', 'nvd3', 'moment'], function($, Backbone, d3, _, tooltipTemplate, nv, moment) {
  function getTime(d) {
    return new Date(d.time);
  }

  function getValue(d) {
    return d.value === undefined ? 0 : d.value;
  }

  var yScaleFormat = d3.format('.3s');
  function formatYAxis(d) {
    return yScaleFormat(d);
  }

  function addMissingGroups(v, k) {
    if (!_.any(this, function(d) {
      return d.key === k
    })) {
      this.push({
        key: k,
        values: v
      });
    }
  }

  return Backbone.View.extend({
    className: 'barchart-box',

    initialize: function() {
    },

    populate: function() {
      this.setupChart();
    },

    setupChart: function() {
      var self = this,
        width = self.$el.width(),
        height = self.$el.height();

      nv.addGraph(function() {
        var chart = nv.models.multiBarChart()
          .margin({
            top: 5,
            bottom: 20,
            left: 45,
            right: 0
          })
          .width(width)
          .height(height)
          .x(getTime)
          .y(getValue)
          .stacked(true)
          .showControls(false)
          .tooltipContent(function (key, x, y, e) {
            return tooltipTemplate({
              time: self.model.timeTooltipFormatter(e.point.time),
              value: e.point.value + ' (' + y + ')',
              group: key
            });
          });

        chart.xAxis
          .scale(d3.time.scale())
          .tickFormat(self.model.timeScaleFormatter)
          .showMaxMin(false);

        chart.yAxis
          .tickFormat(formatYAxis)
          .showMaxMin(false);

        var data = _.map(self.model.metrics, function(v, k) {
          return {
            key: k,
            values: v
          };
        });

        d3.select(self.$el[0])
          .append('svg')
          .datum(data)
          .transition().duration(500)
          .call(chart);

        self.listenTo(self.model, 'render', function() {
          _.forEach(self.model.metrics, addMissingGroups, data);
          chart.update();
        });
        return chart;
      });
    }
  });
});
