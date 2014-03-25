var fs = require('fs'),
    path = require('path');

var widgets = [];
var widgetsDir = path.join(__dirname, '..', 'public', 'scripts', 'widgets');
var exclude = ['empty', 'base'];

// Everything below is gonna be synchronous because :
//   - it should be completed before the server is available
//   - we want it to throw if there's a problem, we don't want a site with no widget at all
var listing = fs.readdirSync(widgetsDir);
listing.forEach(function(name) {
  if (exclude.indexOf(name) !== -1) return;
  if (fs.lstatSync(path.join(widgetsDir, name)).isDirectory()) {
    widgets.push(name);
  }
});

var cachedResponse = 'define(function () { return ' + JSON.stringify(widgets) + '});';
console.info('Starting with the following widgets :' + JSON.stringify(widgets));

module.exports = function (req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(cachedResponse);
}

module.exports.cachedResponse = cachedResponse;
module.exports.widgets = widgets;
