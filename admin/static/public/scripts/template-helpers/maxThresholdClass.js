define('template-helpers/maxThresholdClass', ['Handlebars' ,'template-helpers/thresholdClass'], function (Handlebars, thresholdClass) {
  function maxThresholdClass (value , error, warning) {
    return thresholdClass(value,'max',error,warning)
  }

  Handlebars.registerHelper('maxThresholdClass', maxThresholdClass);
  return maxThresholdClass;
});
