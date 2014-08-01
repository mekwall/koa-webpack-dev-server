// Dependencies
var fs = require('fs');
var path = require('path');
var koa = require('koa');
var CacheStream = require('cache-stream');
var WebSocketServer = require('ws').Server

// Middleware
var middleware = require('./middleware');

// Debug output
var debug = require('debug')('koa:webpack');

// Path to client files
var distFilesPath = path.join(__dirname, '../dist');

function Server (compiler, options) {
    this.parseOptions(options);

    if (!compiler) {
        throw new Error('You need to pass a webpack compiler as first argument');
        return;
    }

    // Init our app
    this.app = koa();

    // Listening on compiler events
    compiler.plugin("compile", this._onCompilerCompile.bind(this));
    compiler.plugin("invalid", this._onCompilerInvalid.bind(this));
    compiler.plugin("done", this._onCompilerDone.bind(this));

    // Prepare html
    var htmlFile = new CacheStream();
    fs.createReadStream(path.join(distFilesPath, '/index.html')).pipe(htmlFile);

    // Prepare js
    var jsFile = new CacheStream();
    fs.createReadStream(path.join(distFilesPath, '/main.js')).pipe(jsFile);

    // Prepare css
    var cssFile = new CacheStream();
    fs.createReadStream(path.join(distFilesPath, '/main.css')).pipe(cssFile);

    this.app.use(function* (next) {
        var file;
        debug('%s', this.url);
        switch (this.url) {
            case '/__dev_server__/main.js':
                this.set('Content-Type', 'application/javascript');
                file = jsFile;
            break;

            case '/__dev_server__/main.css':
                this.set('Content-Type', 'text/css');
                file = cssFile;
            break;

            case '/':
            case '/index.html':
                this.set('Content-Type', 'text/html');
                file = htmlFile;
            break;

            default:
                return yield next;
        }
        this.body = file;
    });

    // Let's mount the middleware
    this.app.use(middleware(compiler, options));

}

Server.prototype._onCompilerInvalid = function () {
    this._compiling = false;
    if (this.app.ws) {
        this.app.ws.broadcast('webpack:invalid');
    }
};

Server.prototype._onCompilerCompile = function () {
    this._compiling = true;
    if (this.app.ws) {
        this.app.ws.broadcast('webpack:compile');
    }
};

Server.prototype._onCompilerDone = function (stats) {
    this._compiling = false;
    if (this.app.ws) {
        this.app.ws.broadcast('webpack:done', stats.toJson());
    }
};

Server.prototype.listen = function () {
    this.app.server = this.app.listen.apply(this.app, arguments);
    var ws = this.app.ws = new WebSocketServer({ 
        server: this.app.server
    });

    var _this = this;

    this.app.ws.broadcast = function (type, payload) {
        for (var i in this.clients) {
            this.clients[i].emit(type, payload);
        }
    };

    ws.on('connection', function (wss) {

        wss.emit = function (type, payload) {
            if (wss.readyState === wss.OPEN) {
                wss.send(JSON.stringify({
                    type: type,
                    data: payload
                }));
            }
        };

        wss.emit('options', {
            hot: _this.hot,
            contentBase: _this.contentBase
        });
    });
};

Server.prototype.parseOptions = function (options) {
    // Make sure options is an object
    options = typeof options === 'object' ? options : {};
    this.port = options.port || 8080;
    this.contentBase = options.contentBase || '/';
    this.hot = options.hot || false;
};

module.exports = Server;