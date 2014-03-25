define([], function() {
  return {
    "name": "Simple barchart",
    "desc": "This widget will display a bar line chart based on the provided formula.",
    "dimensions": {
      "width": {"default":2},
      "height": {"default":1}
    },
    "formulas": {
      "elements": [{
        "name": "element",
        "desc": "Any Metric formula, ie 'avg(memory(cached|buffered))' "
      }],
      "fields": [{
        "name": "main",
        "properties": {
          "default": {
            "name": "bar",
            "period": 86400
          },
          "hidden": {
            "name": true,
          },
          "modifiers": []
        }
      }]
    }
  }
});
