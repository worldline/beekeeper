define(['BaseWidgetModel', 'underscore', 'd3'], function(BaseWidgetModel, _, d3) {
  return BaseWidgetModel.extend({
    normalizeLimits: true,
    limitDataToMaxWidth: true,

    initialize: function(models, params) {
      this.metrics = {};
      this.times = [];
    },
    onData: function(data) {
      var groupName = data.group === undefined ? '' : data.group,
          time = data.time,
          insertionPoint = d3.bisectLeft(this.times, time),
          alreadyExisting = this.times[insertionPoint] === time,
          knownGroup = groupName in this.metrics;

      if (alreadyExisting) {
        if (knownGroup) {
          // We already had the time and knew the group, we just have to overwrite what should be the fake data with
          // the one we just received.
          this.metrics[groupName][insertionPoint].value = data.value;
        } else {
          // Time already existed but we didn't know the group, fill the unknown times with fake data and set the
          // data we just received at the right place.
          this.metrics[groupName] = this.times.map(function(t) {
            if (t === time) return data;
            return {
              time: t,
              value: 0
            }
          });
        }
      } else {
        if (!knownGroup) {
          this.metrics[groupName] = this.times.map(function(t) {
            return {
              time: t,
              value: 0
            }
          });
        }
        // Insert the data we just received in the good collection, and level the other groups to have the same
        // times everywhere.
        _.each(this.metrics, function (values, key) {
          values.splice(insertionPoint, 0, key === groupName ? data : { time: time, value: 0 });
        });

        this.times.splice(insertionPoint, 0, time);
      }

      if (this.times.length > this.maxWidth) {
        // We went over the limit, remove altogether the oldest times
        this.times.shift();
        _.each(this.metrics, function (values) {
          values.shift();
        });
      }

      this.render();
    }
  });
});
