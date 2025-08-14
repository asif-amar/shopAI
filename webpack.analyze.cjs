const { merge } = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const baseConfig = require('./webpack.config.cjs');

module.exports = (env, argv) => {
  const config = baseConfig(env, argv);
  
  return merge(config, {
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
        reportFilename: 'bundle-report.html',
      }),
    ],
  });
}; 