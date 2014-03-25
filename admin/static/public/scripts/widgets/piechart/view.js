define(['jquery', 'backbone', 'd3', 'underscore', 'hbs!./tooltip', 'nvd3'], function($, Backbone, d3, _, tooltipTemplate, nv) {
  function getGroup(d) {
    return d.group;
  }

  function getValue(d) {
    return d.value;
  }

  return Backbone.View.extend({
    className: 'piechart-box',

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
        var chart = nv.models.pieChart()
          .width(width)
          .height(height)
          .x(getGroup)
          .y(getValue)
          .showLabels(false);

        d3.select(self.$el[0])
          .append('svg')
          .datum(self.model.metrics)
          .transition().duration(500)
          .call(chart);

        self.listenTo(self.model, 'render', function() {
          chart.update()
        });

        return chart;
      });

    }
  });
});
