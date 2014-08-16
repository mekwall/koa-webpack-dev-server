// Styles
require('./main.styl');

// Debug output
var debug = require('debug')('devserver');

// WebSocket client
var koaws = require('koa-ws/client');
koaws.connect(__resourceQuery.substr(1));

var options = {};

koaws.on('open', function () {
  debug('Connected!');
});

koaws.register('options', function (err, data) {
  options = data;
  if (options.hot) {
    debug('Hot Module Replacement enabled');
  }
});

koaws.register('reload', function (err, data) {
  reloadPage();
});

koaws.register('webpack', {
  compile: function (err, data) {
    debug('Webpack is compiling');
  },
  invalid: function (err, data) {
    debug('Webpack bundle is now invalid');
  },
  done: function (err, data) {
    debug('Webpack finished compiling: %sms', data.time);
    checkWebpackStats(data);
  }
});

var reloadThrottled = null;
function reloadPage() {
  if (reloadThrottled) { return; }
  debug('Reloading page...');
  window.location.reload();
}

function reloadCss(file) {
  debug('Reloading CSS: %s', file);
  var links = document.getElementsByTagName('link');
  for (var i = 0; i < links.length;i++) { 
    var link = links[i];
    if (link.rel === 'stylesheet' && link.href.indexOf(file) !== -1) {
      // Add a timestamp to the href to force the browser to reload
      if (link.href.indexOf('__time__=') !== -1) {
        link.href = link.href.replace(/__time__\=([0-9])+/, '__time__=' + Date.now());
      } else {
        link.href += '?__time__=' + Date.now();
      }
    }
  } 
}

// Initial check
window.postMessage('webpackHotUpdate', '*');

function checkWebpackStats(stats) {
  var emitted = [];
  var hotReload = false;

  for (var i = 0, l = stats.warnings.length; i < l; i++) {
    console.warn(stats.warnings[i]);
  }

  for (var i = 0, l = stats.errors.length; i < l; i++) {
    console.error(stats.errors[i]);
  }

  for (var i = 0, l = stats.assets.length; i < l; i++) {
    // Only handle emitted assets
    if (stats.assets[i].emitted) {
      emitted.push(stats.assets[i].name);
      if (/\.(js|jsx|json)$/.test(stats.assets[i].name)) {
        // Reload page and break
        if (options.hot) {
          hotReload = true;
          var script = document.createElement('script');
          script.src = 'http://' + __resourceQuery.substr(1) + '/assets/' + stats.assets[i].name;
          document.body.appendChild(script);
        } else {
          reloadPage();
        }
        break;
      } else if (/\.(css|styl|scss|less|sass)$/.test(stats.assets[i].name)) {
        // Hot reload CSS
        reloadCss(stats.assets[i].name);
      }
    }
  }

  if (hotReload) {
    debug('Hot update');
    window.postMessage('webpackHotUpdate', '*');
  }

  debug('Emitted files: %o', emitted);
}