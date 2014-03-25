require.config({
  map: {
    '*': {
      'less': 'vendor/require-less/less'
    }
  },
  paths: {
    jquery: [
      '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min',
      'vendor/jquery/jquery.min'
    ],
    mentions: 'vendor/jquery-mentions',
    elastic: 'vendor/jquery-elastic',
    caret: 'vendor/jquery-caret/jquery.caret',
    rename: 'vendor/jquery-rename',
    underscore: [
      '//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min',
      'vendor/lodash/dist/lodash.min'
    ],
    backbone: [
      '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.0/backbone-min',
      'vendor/backbone/backbone-min'
    ],
    hbs: 'vendor/requirejs-handlebars/hbars',
    Handlebars: 'vendor/handlebars.js/dist/handlebars',
    text: 'vendor/requirejs-text/text',
    d3: [
      '//cdnjs.cloudflare.com/ajax/libs/d3/3.3.11/d3.min',
      'vendor/d3/d3.min'
    ],
    dropdown: 'vendor/bootstrap/js/dropdown',
    modal: 'vendor/bootstrap/js/modal',
    nvd3: 'vendor/nvd3/nv.d3.min',
    moment: [
      '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.4.0/moment-with-langs.min',
      'vendor/moment/min/moment-with-langs.min'
    ],

    BaseWidgetModel: 'widgets/base/model'
  },

  shim: {
    'underscore': {
      exports: '_'
    },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'jquery': {
      exports: '$'
    },
    'Handlebars': {
      exports: 'Handlebars'
    },
    'd3': {
      deps: ['underscore'],
      exports: 'd3'
    },
    'modal': ['jquery'],
    'dropdown': ['jquery'],
    'rename': ['jquery'],
    'caret': ['jquery'],
    'elastic': ['jquery'],
    'mentions': ['underscore', 'jquery'],
    'nvd3': {
      deps: ['d3'],
      exports: 'nv',
      init: function () {
        // Disable dev mode of nvd3
        this.nv.dev = false;
      }
    },
    'vendor/jquery-plugins': ['jquery', 'underscore']
  },

  hbars: {
    extension: '.hbs'
  }
});

// Load libs 1st, preferred with non-AMD libs when building the app
require(['jquery', 'underscore', 'backbone', 'moment', 'template-helpers/helpers'], function($, _, Backbone, moment) {
  var lang = (navigator.language || navigator.browserLanguage).slice(0, 2);
  moment.lang(lang);

  require(['app', 'config'], function(App, config) {
    require.config({
      paths: {
        'socket.io': [
          '//cdnjs.cloudflare.com/ajax/libs/socket.io/0.9.16/socket.io.min',
          config.apiUrl + '/socket.io/socket.io'
        ]
      },
      shim: {
        'socket.io': {
          exports: 'io'
        }
      }
    });

    require(['d3'], function (d3) {
      // Flush d3 timer every minute to avoid interface freeze
      // The reason seems to be this : https://groups.google.com/d/msg/d3-js/awtq5EnvH64/r0fcEQI07mMJ
      // `requestAnimationFrame`, when supported by the browser, is delayed until the tab is visible again
      // thus causing a massive lag when beekeeper is left in the background for while, piling up the updates.
      setInterval(d3.timer.flush, 30e3);
    });

    App.router.appStart();
  });
});
