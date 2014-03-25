define(['underscore', 'BaseWidgetModel', 'd3'], function(_, BaseWidgetModel, d3) {
  var bisector = d3.bisector(function(d) { return d.time; }).left;

  return BaseWidgetModel.extend({
    normalizeLimits: true,
    limitDataToMaxWidth: true,

    initialize: function(models, params) {
      this.metrics = [];
      this.groupedMetrics = {};
    },
    onData: function(data) {
      var metrics;
      if (data.group in this.groupedMetrics) {
        metrics = this.groupedMetrics[data.group];
      } else {
        metrics = this.groupedMetrics[data.group] = [];
        this.metrics.push({ key: data.group, values: metrics, area: true });
      }

      var insertionPoint = bisector(metrics, data.time);
      /* Insert new point or replace if same time */
      metrics.splice(insertionPoint, (metrics[insertionPoint] && metrics[insertionPoint].time === data.time) ? 1 : 0, data);

      if (metrics.length > this.maxWidth) {
        metrics.shift();
      }

      this.render();
    }
  });
});
