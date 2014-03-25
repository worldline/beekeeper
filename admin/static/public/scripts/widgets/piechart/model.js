define(['underscore', 'BaseWidgetModel', 'd3'], function(_, BaseWidgetModel, d3) {
  function hightolow(a, b) {
    return b.value - a.value;
  }

  return BaseWidgetModel.extend({
    initialize: function(models, params) {
      this.metrics = [];
      this.others; // Fake group for groups oustide the selection
      this.groupLimit = params.parent.get('formulas')[0].max;
      this.latestMetrics = {};
    },
    onData: function(data) {
      if (!('group' in data)) {
        return; // Data has to be grouped, we can't categorize times or values
      }

      if (data.group in this.latestMetrics) {
        if (this.latestMetrics[data.group].time < data.time) {
          data.disabled = this.latestMetrics[data.group].disabled;
          this.latestMetrics[data.group] = data;
        }
      } else {
        this.latestMetrics[data.group] = data;
      }

      var sortedMetrics = d3.values(this.latestMetrics).sort(hightolow);
      var topMetrics = sortedMetrics.slice(0, this.groupLimit);
      var othersDisabled = this.others ? this.others.disabled : false;
      this.others = sortedMetrics.slice(this.groupLimit);
      if (this.others.length) {
        this.others = this.others.reduce(function(memo, group) {
          memo.value += group.value;
          return memo;
        }, { group: 'others', value: 0, disabled: othersDisabled });
      }

      // Replace the whole array with the new ranking
      this.metrics.splice.apply(this.metrics, [0, this.metrics.length].concat(topMetrics, this.others));

      this.render();
    }
  });
});
