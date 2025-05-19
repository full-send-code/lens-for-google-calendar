const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    popup: path.join(__dirname, 'src/popup/index.tsx'),
    options: path.join(__dirname, 'src/options/index.tsx'),
    background: path.join(__dirname, 'src/background.ts'),
    contentScript: path.join(__dirname, 'src/content/index.tsx'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/, /src\/inject/],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json' },
        { from: 'icons', to: 'icons' }
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src/popup/popup.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src/options/options.html'),
      filename: 'options.html',
      chunks: ['options'],
    }),
    // Include ZIP plugin only in production mode
    ...(process.env.NODE_ENV === 'production' 
      ? [new ZipPlugin({ 
          filename: 'lens-for-google-calendar.zip',
          pathPrefix: '',
        })]
      : [])
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  devtool: 'cheap-module-source-map',
};
