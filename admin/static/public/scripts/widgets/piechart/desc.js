define([], function() {
  return {
    "name": "Simple piechart",
    "desc": "This widget will display a pie chart based on the provided formula.",
    "dimensions": {
      "width": {
        "default": 1
      },
      "height": {
        "default": 1
      }
    },
    "formulas": {
      "elements": [{
        "name": "element",
        "desc": "Any Metric formula with a group, ie 'avg(memory(cached|buffered)).group(host)'"
      }, {
        "name": "max",
        "desc": "How many of the top groups to keep."
      }],
      "fields": [{
        "name": "main",
        "properties": {
          "default": {
            "name": "pie",
            "period": 86400
          },
          "hidden": {
            "name": true,
            "period": true
          },
          "modifiers": []
        }
      }]
    }
  }
});
