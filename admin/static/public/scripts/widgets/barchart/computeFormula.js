define(['underscore'], function(_) {
  return {
    compute: function computeFormula(formulas) {
      return _.map(formulas, function(formula) {
        return {
          kind: 'metric',
          step: formula.refresh * 1000,
          limit: Math.max(formula.width / formula.refresh, 2),
          name: 'bar',
          position: 'main',
          expression: formula.element
        };
      });
    },

    explode: function explodeFormula(formulas) {
      return {
        element: formulas[0].expression
      }
    }
  }
});
