define(['jquery', 'underscore', 'config'], function($, _, config) {

  var lists = 0,
    list = {},
    treesUrl = config.apiUrl + '/hierarchy/trees';

  return function cleanFormula(formula, ctx, cb) {
    if (!formula) {
      return cb();
    }

    if (!formula.match) {
      return cb(formula);
    }

    var matches = formula.match(/(?:childOf\()([^#][^\)]*)\)/g),
      toSend = [];

    _.each(matches, function(match) {
      // Extract the list of ids from the hierarchy
      var inside = match.replace(/(?:childOf\()([^#][^\)]*)\)/, '$1');

      // we do the repalcement before the result
      if (!list[inside]) {
        lists++;
        list[inside] = '#' + lists;
        toSend.push(_.flatten(JSON.parse(inside), true));
      }
      formula = formula.replace(inside, list[inside]);
    });

    //we dont want it to be done right now, but the formula can be inserted in the field
    setTimeout(function() {
      cb(formula);
    }, 0);

    if (toSend.length > 0) {
      // Get extra information about the hierarchy components we have found
      $.ajax({
        type: 'POST',
        url: treesUrl,
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(toSend),
        success: function(data) {
          _.each(data, function(el) {
            ctx.consume(el);
          });
        }
      });
    }
  };
});
