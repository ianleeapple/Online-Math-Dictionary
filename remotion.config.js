const path = require('path');

module.exports = {
  // Remotion 配置
  entry: './server/video/components/MathVideoRoot.jsx',
  
  // 輸出配置
  publicPath: '/',
  
  // 啟用 ES 模組
  esModules: true,
  
  // Babel 配置
  overrideBabelConfig: (currentBabelConfig) => {
    return {
      ...currentBabelConfig,
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
      ],
      plugins: [
        ...currentBabelConfig.plugins,
        '@babel/plugin-transform-runtime',
      ],
    };
  },
  
  // Webpack 配置覆蓋
  webpackOverride: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          'katex': path.resolve(__dirname, 'node_modules/katex'),
        },
      },
      module: {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
          },
        ],
      },
    };
  },
};