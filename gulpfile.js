var path = require('path');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var webpack = require('webpack');
var webpackConfig = require('./src/client/webpack.config.js');
var jade = require('gulp-jade');

gulp.task('default', function (cb) {
    runSequence('build', 'dev', function () {
        cb();
    });
});

gulp.task('deploy', function (cb) {
    runSequence('build', 'npm:deploy', function () {
        cb();
    });
});

gulp.task('build', function (callback) {
    var debug = require('debug')('gulp:build');

    var outputPath = path.join(process.cwd(), 'dist');
    gulp.src('./src/client/*.jade')
        .pipe(jade())
        .pipe(gulp.dest(outputPath));

    // modify some webpack config options
    var config = Object.create(webpackConfig);
    config.plugins = config.plugins.concat(
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin()
    );

    // run webpack
    webpack(config, function (err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack:build', err);
        }
        debug(stats.toString({ colors: true }));
        callback();
    });

});

gulp.task('dev', function () {
    var Server = require('./src/index');
    var compiler = webpack(require('../bonobo/config/webpack.js'));
    var devServer = new Server(compiler, {
        quiet: false,
        contentBase: 'http://localhost:3000/'
    });

    devServer.listen(8080, function () {
        console.log('Listening to 8080');
    });
});

gulp.task('npm:deploy', function () {

});