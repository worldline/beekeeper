define('template-helpers/minThresholdClass', ['Handlebars', 'template-helpers/thresholdClass'], function (Handlebars, thresholdClass) {
  function minThreholdClass (value , error, warning) {
    return thresholdClass(value,'min',error,warning);
  }

  Handlebars.registerHelper('minThresholdClass', minThreholdClass);
  return minThreholdClass;
});
