define('template-helpers/thresholdClass', ['Handlebars'], function (Handlebars) {
  function thresholdClass (value, type, error, warning) {
    switch (type) {
      case 'min':
        if (error && value < error) {
          return 'error';
        }
        if (warning && value < warning) {
          return 'warning';
        }
        return 'ok';
      case 'max':
        if (error && value > error) {
          return 'error';
        }
        if (warning && value > warning) {
          return 'warning';
        }
        return 'ok';
    }
  }

  Handlebars.registerHelper('thresholdClass', thresholdClass);
  return thresholdClass;
});
