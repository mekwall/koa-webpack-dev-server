var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    context: __dirname,
    entry: {
        main: './main'
    },
    output: {
        path: path.join(__dirname, '../../dist'),
        filename: '[name].js'
    },
    plugins: [
        new ExtractTextPlugin('[name].css', { allChunks: true })
    ],
    module: {
        resolve: {
            extensions: ['', '.js', '.css', '.styl']
        },
        loaders: [
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract(
                    'style-loader',
                    'css-loader'
                )
            },
            {
                test: /\.styl$/,
                loader: ExtractTextPlugin.extract(
                    'style-loader',
                    'css-loader!stylus-loader'
                )
            }
        ]
    },
    recordsPath: path.join(process.cwd(), 'cache', 'webpack.json')
}