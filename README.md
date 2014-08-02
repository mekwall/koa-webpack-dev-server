# koa-webpack-dev-server

> A stand-alone development server for webpack, based on the awesomeness that is koa.js.

### Features

* Automatic injection of livereload code
* Hot reload of CSS files, full page reload for JS
* Acts as a proxy for your content server

## Usage

### Installation

    $ npm install koa-webpack-dev-server

### Example setup

    // Include necessary deps
    var webpack = require('webpack');
    var DevServer = require('koa-webpack-dev-server');

    // Load our webpack config
    var webpackConfig = require('./webpack.config.js');

    // Modify some webpack config options for development
    var devConfig = Object.create(webpackConfig);
    devConfig.devtool = 'sourcemap';
    devConfig.debug = true;

    // This should point to the server that has the content
    var contentBase = 'http://localhost:3000/';

    // Create a compiler based on our dev config
    var compiler = webpack(devConfig);

    // Create a development server instance
    var devServer = new DevServer(compiler, {
        contentBase: contentBase
    });

    // Start listening!
    devServer.listen(8080, 'localhost', function () {
        debug('Listening to 8080');
    });

Go to `http://localhost:8080/' and you should see your site.

## Contributing

Clone the repo and run:

    $ npm install
    $ gulp

## License

Copyright (c) 2014, Marcus Ekwall <marcus.ekwall@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.