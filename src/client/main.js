// Styles
require('./main.styl');

// Debug output
var debug = require('debug')('devserver');

// Create our WebSocket client
// TODO: port shouldn' be hardcoded
var ws = new WebSocket('ws://localhost:8080/');
var options = {};

ws.onopen = function () {
    debug('Connected!');
};

ws.onmessage = function (e) {
    try {
        var payload = JSON.parse(e.data);
    } catch (e) {
        throw new Error(e.stack);
    }
    var type = payload.type;
    var data = payload.data;

    switch (type) {
        case 'options':
            options = data;
        break;

        case 'reload':
            reloadPage();
        break;

        case 'webpack:compile':
            debug('Webpack is compiling bundle');
        break;

        case 'webpack:invalid':
            debug('Webpack bundle is invalid');
        break;

        case 'webpack:done':
            debug('Webpack have finished compiling bundle', data);
            checkWebpackStats(data);
        break;
    }
}

var reloadThrottled = null;
function reloadPage() {
    if (reloadThrottled) { return; }
    debug('Reloading page...');
    window.location.reload();
}

function reloadCss(file) {
    debug('Reloading CSS: ', file);
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

function checkWebpackStats(stats) {
    var emitted = [];
    for (var i = 0, l = stats.assets.length; i < l; i++) {
        // Only handle emitted assets
        if (stats.assets[i].emitted) {
            emitted.push(stats.assets[i]);
            if (stats.assets[i].name.indexOf('.js') !== -1) {
                // Reload page and break
                reloadPage();
                return;
            } else if (stats.assets[i].name.indexOf('.css') !== -1) {
                // Hot reload CSS
                reloadCss(stats.assets[i].name);
            }
        }
    }
}