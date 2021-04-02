const path = require('path');

module.exports = (env) => ({
  mode: env == 'production' ? 'production' : 'development',
  entry: {
    main: './app/scripts/main.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
});
