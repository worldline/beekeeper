#!/usr/bin/env node
var requirejs = require('requirejs');
var fs = require('fs');
var widgetList = require('./bin/widgetList');

var config = {
  baseUrl: './public/scripts',
  dir: './generated/scripts',

  mainConfigFile: './public/scripts/main.js',

  preserveLicenseComments: false,
  inlineText: true,
  optimize: 'uglify2',
  generateSourceMaps: true,
  skipDirOptimize: true,
  optimizeCss: 'none',
  removeCombined: true,

  paths: {
    'config': '../../config/' + (process.env.NODE_ENV || 'development'),
    'socket.io': 'empty:',
    'jquery': 'empty:',
    'underscore': 'empty:',
    'backbone': 'empty:',
    'd3': 'empty:',
    'moment': 'empty:',
    'momentlang': 'empty:',
    'nvd3': 'empty:'
  },

  rawText: {
    'widgets/list': widgetList.cachedResponse
  },

  stubModules: ['text', 'hbars', 'hbs'],
  onBuildWrite: function(moduleName, path, content) {
    if (moduleName === 'Handlebars') {
      // replace handlebars with the runtime version
      path = path.replace(/handlebars.js$/, 'handlebars.runtime.js');
      content = fs.readFileSync(path, 'utf8');
      content = content.replace(/(define\()(function)/, '$1"handlebars", $2');
    } else if (moduleName === 'main') {
      // Here comes a dirty trick to replace the "paths" elements in requirejs configuration
      // that concerns the jquery-plugin optimized module.

      // Get the jquery-plugins module build definition programmatically to avoid duplication and mistakes when modified
      var jqplugins = this.modules.reduce(function(obj, module) {
        if (module.name === 'vendor/jquery-plugins') return module;
        return obj;
      }, null);

      if (jqplugins) {
        var baseUrl = this.baseUrl;
        var paths = this.paths;

        // Take all the includes from the jquery-plugins, substitute all their definitions with the optimized one
        jqplugins.include.forEach(function(include) {
          content = content.replace(paths[include].replace(baseUrl, ''), 'vendor/jquery-plugins');
        });
      }
    }
    return content;
  },

  modules: [{
    name: 'main',
    include: [
      'app',
      'config',
      'interface/cube',
      'BaseWidgetModel'
    ],
    exclude: ['vendor/jquery-plugins']
  }, {
    name: 'vendor/jquery-plugins',
    include: ['modal', 'dropdown', 'rename', 'caret', 'elastic', 'mentions']
  }]
};

widgetList.widgets.forEach(function (widget) {
  config.modules.push({
    name: 'widgets/' + widget + '/index',
    exclude: ['main', 'vendor/jquery-plugins', 'vendor/require-less/normalize']
  });
});

requirejs.optimize(config, function (buildResponse) {
  console.log(buildResponse)
}, function(err) {
  console.error(err);
  process.exit(2);
});
