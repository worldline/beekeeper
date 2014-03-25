define(['underscore'], function(_) {
  return {
    compute: function computeFormula(formulas) {
      return _.map(formulas, function(formula) {
        return {
          kind: 'metric',
          step: formula.refresh * 1000,
          limit: 2, // Span on 2 tiers to make sure we have at least 1
          max: Math.abs(+formula.max) || 5, // Default to 5 if invalid value is entered
          name: 'pie',
          position: 'main',
          expression: formula.element
        };
      });
    },

    explode: function explodeFormula(formulas) {
      return {
        element: formulas[0].expression,
        max: formulas[0].max
      }
    }
  }
});
