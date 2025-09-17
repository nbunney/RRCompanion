const path = require('path');

module.exports = {
  entry: './src/handlers/index.ts',
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '.webpack'),
    filename: 'index.js',
  },
  externals: {
    'aws-sdk': 'aws-sdk',
  },
  optimization: {
    minimize: false,
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
