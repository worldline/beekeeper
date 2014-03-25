define(['underscore'], function(_) {

  return {
    compute: function computeFormula(formulas) {
      return _.map(formulas, function(formula) {
        var value = {
          kind: 'metric',
          step: formula.refresh * 1000,
          limit: Math.max(formula.width / formula.refresh, 2),
          name: "line",
          position: "main",
          expression: formula.element
        }

        return value
      })
    },

    explode: function explodeFormula(formulas) {
      return {
        element: formulas[0].expression
      }
    }
  }
});