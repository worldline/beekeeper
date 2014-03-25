define(['jquery', 'backbone', 'd3', 'underscore', 'hbs!./tooltip', 'nvd3', 'moment'], function($, Backbone, D3, _, tooltipTemplate, nv, moment) {
  function getTime(d) {
    return new Date(d.time);
  }

  function getValue(d) {
    // nvd3 scatter ploting doesn't take undefined values very well, make it null.
    return d.value === undefined ? null : d.value;
  }

  function maxWidth(selection) {
    return Math.max.apply(Math, selection.map(function() { return this.getComputedTextLength(); }));
  }

  var yScaleFormat = D3.format('.3s');

  return Backbone.View.extend({
    className: 'stackedchart-box',

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
        var chart = nv.models.stackedAreaChart()
          .margin({ top: 5, bottom: 20, left: 45, right: 0 })
          .showLegend(self.model.metrics.length > 1)
          .width(width)
          .height(height)
          .x(getTime)
          .y(getValue)
          .controlsData(['Stacked','Expanded'])
          .tooltipContent(function(key, x, y, e) {
            return tooltipTemplate({
              group: key,
              time: self.model.timeTooltipFormatter(e.point.time),
              value: e.point.value + ' (' + y + ')'
            });
          });

        chart.xAxis
          .scale(D3.time.scale())
          .ticks(D3.time.days, 1)
          .tickFormat(self.model.timeScaleFormatter)
          .showMaxMin(false);

        chart.yAxis
          .tickFormat(function(d) {
            return yScaleFormat(d);
          })
          .showMaxMin(false);

        D3.select(self.$el[0])
          .append('svg')
          .datum(self.model.metrics)
          .transition().duration(500)
          .call(chart);

        self.listenTo(self.model, 'render', function() {
          chart.showLegend(self.model.metrics.length > 1);
          chart.update();
        });
        return chart;
      });
    }
  });
});
