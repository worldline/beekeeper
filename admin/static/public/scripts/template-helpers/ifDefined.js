define('template-helpers/ifDefined', ['Handlebars'], function(Handlebars) {

  var toString = Object.prototype.toString,
    functionType = "[object Function]";

  function ifDefined(context, options) {
    var type = toString.call(context);
    if (type === functionType) {
      context = context.call(this);
    }

    if (context == null || Handlebars.Utils.isEmpty(context)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  }
  Handlebars.registerHelper('ifDefined', ifDefined);
  return ifDefined;
});
