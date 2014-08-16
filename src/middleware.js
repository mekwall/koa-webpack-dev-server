var path = require('path');
var mime = require('mime');
var debug = require('debug')('koa:webpack-middleware');
var MemoryFileSystem = require('memory-fs');

module.exports = function (compiler, options) {
    var webpackConfig = compiler.options;
    var outputFilename = webpackConfig.output.filename;
    var outputPath = webpackConfig.output.path;
    var publicPath = webpackConfig.output.publicPath;

    options = options || {};
    options.quiet = options.quiet || false;
    options.stats = typeof options.stats === 'object' || { colors: true };

    // Create memory files system
    var mfs = new MemoryFileSystem();
    // Attach memory fs to compiler
    compiler.outputFileSystem = mfs;

    var compiling = true;
    compiler.watch(200, function handleCompile (err, stats) {
        compiling = false;
        if (err) {
            debug('Compilation failed. Trying agian...');
            setTimeout(function(){
                compiler.watch(200, handleCompile);
            }, 500);
        }
        if (!options.quiet && stats) {
            console.log(stats.toString(options.stats));
        }
    });

    compiler.plugin('invalid', function () {
        debug('Assets are now invalid');
    });

    compiler.plugin('compile', function () {
        compiling = true;
        debug('Compiling assets');
    });

    // Thunk generator for compiler.plugin
    var compilerPluginThunk = function (method) {
        return function (cb) {
            compiler.plugin(method, function (result) {
                cb(null, result);
            });
        }
    };

    // Create a thunk that can be yielded by co
    var compilerDone = compilerPluginThunk('done');

    // Return the actual middleware
    return function* (next) {
        // Bail if request method is not GET
        if (this.method !== 'GET') return yield next;

        var url = this.url;
        var qidx = this.url.indexOf('?');
        if (qidx >= 0) {
            url = url.substr(0, qidx);
        }

        // Extension of url
        var ext = path.extname(url);

        // Filename without extension
        var file = path.basename(url, ext);

        // Output file
        var outputFile = path.join(outputPath, file + ext);

        // Bundle file based on url
        var isBundleFile = url === (publicPath + outputFilename.replace('[name]', file));

        // Do a file stat
        var fileStat = null;
        try {
            // Bundle file if exists in memory fs
            fileStat = mfs.statSync(outputFile);
            if (fileStat.isFile()) {
                isBundleFile = true;
            }
        } catch (e) {}

        if (!isBundleFile) {
            return yield next;
        }

        // If we're here, we have a webpack entry file
        debug('GET %s', url);

        // If compiling, await completion
        if (compiling) {
            yield compilerDone;
        }

        this.set('Content-Type', mime.lookup(outputFile));
        if (fileStat) {
            this.set('Content-Length', fileStat.size);
        }
        this.body = mfs.readFileSync(outputFile);
    };
}