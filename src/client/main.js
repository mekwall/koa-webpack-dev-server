// Styles
require('normalize.css/normalize.css');
require('./main.styl');

var ws = new WebSocket('ws://localhost:8080/');
var iframe = document.getElementById('loader');
var options = {};

ws.onconnection = function () {

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
            iframe.src = options.contentBase;
        break;

        case 'reload':
            iframe.location.reload();
        break;

        case 'webpack:compile':
            console.log('webpack is compiling')
        break;

        case 'webpack:compile':
            console.log('bundle is invalid')
        break;

        case 'webpack:done':
            console.log('compilation done', data);
        break;
    }
}