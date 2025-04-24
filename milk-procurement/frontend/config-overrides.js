const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add node polyfills
  config.resolve.alias = {
    ...config.resolve.alias,
    stream: 'stream-browserify',
    zlib: 'browserify-zlib',
    util: 'util/',
    assert: 'assert/',
    process: 'process/browser',
  };

  // Add plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  // Update babel-loader configuration
  const babelLoader = config.module.rules
    .find(rule => rule.oneOf)
    .oneOf.find(
      rule => rule.loader && rule.loader.includes('babel-loader')
    );
  
  if (babelLoader) {
    babelLoader.options.presets = [
      ['@babel/preset-env', {
        targets: {
          node: 'current',
        },
      }],
      '@babel/preset-react',
    ];
    
    // Add plugins for optional chaining and nullish coalescing
    babelLoader.options.plugins = [
      ...(babelLoader.options.plugins || []),
      '@babel/plugin-proposal-optional-chaining',
    ];
  }

  return config;
}; 