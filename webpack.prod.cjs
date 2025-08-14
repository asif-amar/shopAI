const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.cjs');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = (env, argv) => {
  const config = baseConfig(env, argv);
  
  return merge(config, {
    plugins: [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
    ],
    optimization: {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
        },
      },
    },
  });
}; 