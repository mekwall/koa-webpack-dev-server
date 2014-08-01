var path = require('path');

module.exports = {
    context: __dirname,
    entry: {
        devserver: './main'
    },
    output: {
        path: path.join(__dirname, '../../dist'),
        filename: '[name].js'
    },
    plugins: [],
    module: {
        resolve: {
            extensions: ['', '.js', '.css', '.styl']
        },
        loaders: [
            {
                test: /\.css$/,
                loader: 'style!css'
            },
            {
                test: /\.styl$/,
                loader: 'style!css!stylus'
            }
        ]
    },
    recordsPath: path.join(process.cwd(), 'cache', 'webpack.json')
}