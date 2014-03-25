define([], function() {
  /**
   * Creates a matrix of space occupation of the dashboard,
   * it is used to determine the potential place for a new widget.
   * @param  {Number} dashboardWidth   Number of slots on the X-axis of the dashboard.
   * @param  {Number} dashboardHeight  Number of slots on the Y-axis of the dashboard.
   * @param  {Object} widgets          Collection of widgets the dashboard holds.
   * @return {Array}                   Array of arrays marking each slot as occupied or not.
   */
  function createDashboardMatrix(dashboardWidth, dashboardHeight, widgets) {
    var i, j, line, matrix = new Array(dashboardHeight);

    for (i = 0; i < dashboardHeight; i++) {
      line = new Array(dashboardWidth);

      // initialise columns insides rows
      for (j = 0; j < dashboardWidth; j++) {
        line[j] = {
          v: false
        };
      }
      matrix[i] = line;
    }

    // get a matrix of used location
    widgets.forEach(function(widget) {
      var i, j,
      xPosition = widget.get('position_x'),
        yPosition = widget.get('position_y'),
        widgetWidth = widget.get('width'),
        widgetHeight = widget.get('height');
      for (i = yPosition; i < yPosition + widgetHeight; i++) {
        for (j = xPosition; j < xPosition + widgetWidth; j++) {
          if (matrix && matrix[i - 1] && matrix[i - 1][j - 1]) {
            matrix[i - 1][j - 1].v = true;
          }
        }
      }
    });

    return matrix;
  }

  /**
   * Given dashboard and widget dimensions, find a place in the dashboard matrix to fit it.
   * @param  {Number} dashboardWidth  Dashboard's width
   * @param  {Number} dashboardHeight Dashboard's height
   * @param  {Number} widgetWidth     Widget's width
   * @param  {Number} widgetHeight    Widget's height
   * @param  {Array}  matrix          Occupation matrix of the dashboard
   * @return {[type]}                 Position where the widget should go like `{ position_x: X, position_y: Y }`,
   *                                  or empty object.
   */
  function findPlace(dashboardWidth, dashboardHeight, widgetWidth, widgetHeight, matrix) {
    var keepGoing = true,
      i, j, ii, jj;
    //iteration for everythin starting position
    for (i = 0; i < dashboardHeight + 1 - widgetHeight; i++) {
      for (j = 0; j < dashboardWidth + 1 - widgetWidth; j++) {

        keepGoing = true;
        //for this starting position, iteration of the size of the widget
        for (ii = 0; keepGoing && (ii < widgetHeight); ii++) {
          for (jj = 0; keepGoing && (jj < widgetWidth); jj++) {
            //if this position is not available we want to start with a new starting position
            if (matrix && matrix[i + ii] && matrix[i + ii][j + jj] && matrix[i + ii][j + jj].v !== false) {
              keepGoing = false;
            }
          }
        }

        if (keepGoing) {
          return {
            position_y: i + 1,
            position_x: j + 1
          };
        }
      }
    }

    return {};
  }

  /**
   * Find a place for the widget considering dimensions and available space.
   * @param  {Number} dashboardWidth  Dashboard's width
   * @param  {Number} dashboardHeight Dashboard's height
   * @param  {Number} widgetWidth     Widget's width
   * @param  {Number} widgetHeight    Widget's height
   * @param  {Array}  widgets         List of already existing widgets
   * @return {Object}                 Position where the widget should go like `{ position_x: X, position_y: Y }`,
   *                                  or empty object.
   */
  return function(dashboardWidth, dashboardHeight, widgetWidth, widgetHeight, widgets) {
    if (widgetHeight > dashboardHeight || widgetWidth > dashboardWidth) {
      // There's no room for the widget
      return {};
    }

    var matrix = createDashboardMatrix(dashboardWidth, dashboardHeight, widgets);
    widgetHeight = Math.max(widgetHeight, 1);
    widgetWidth = Math.max(widgetWidth, 1);
    return findPlace(dashboardWidth, dashboardHeight, widgetWidth, widgetHeight, matrix);
  };
});