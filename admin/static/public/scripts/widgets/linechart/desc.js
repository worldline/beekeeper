define([], function() {
  return {
    "name": "Simple linechart",
    "desc": "This widget will display a simple line chart based on the provided formula.",
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
            "name": "line",
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