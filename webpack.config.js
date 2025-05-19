const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    bundle: path.join(__dirname, 'src/inject/inject.tsx'),
    background: path.join(__dirname, 'src/background.ts'),
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
        exclude: /node_modules/,
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
        { from: 'icons', to: 'icons' },
        { from: 'index.html', to: 'index.html' },
        { from: 'src/styles', to: 'styles' }
      ],
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
