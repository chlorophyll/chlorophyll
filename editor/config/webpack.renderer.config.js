'use strict'

process.env.BABEL_ENV = 'renderer'

const path = require('path')
const { dependencies } = require('../package.json')
const webpack = require('webpack')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
let whiteListedModules = ['vue']

let rendererConfig = {
  mode: 'development',
  devtool: '#inline-source-map',
  entry: {
    renderer: path.join(__dirname, '../src/main.js')
  },
  externals: [
    ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d))
  ],
  module: {
    // Squash dynamic-require errors
    exprContextCritical: false,
    rules: [
      {
        test: /\.(js|vue)$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter')
          }
        }
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      },
      {
        test: /\.s[ac]ss$/,
        loaders: [
          'vue-style-loader',
          'css-loader',
          'resolve-url-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader'
      },
      {
        test: /\.js$/,
        use: 'cache-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.vue$/,
        use: [
          'cache-loader',
          {
            loader: 'vue-loader',
            options: {
              extractCSS: process.env.NODE_ENV === 'production',
              loaders: {
                sass: [
                  'vue-style-loader',
                  'css-loader',
                  'resolve-url-loader',
                  'sass-loader?indentedSyntax=1'
                ],
                scss: [
                  'vue-style-loader',
                  'css-loader',
                  'resolve-url-loader',
                  'sass-loader'
                ]
              }
            },
          }
        ]
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name].[ext]'
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name].[ext]'
          }
        }
      },
      // THREE examples add new constructors to the THREE object rather than
      // exporting a module, so they're imported for side effects.
      {
        test: /three\/examples\/js/,
        use: 'imports-loader?THREE=three'
      },
      {
        test: /\.(frag|vert|glsl)$/,
        use: 'raw-loader',
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.ejs'),
      minify: false,
      nodeModules: path.resolve(__dirname, '../node_modules')
    }),
    new VueLoaderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    // Automatically inject 'var $ = require('jquery');' if $ is used
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new webpack.DefinePlugin({
      'process.env.FLUENTFFMPEG_COV': false
    })
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron')
  },
  resolve: {
    extensions: ['.js', '.ts', '.vue', '.json', '.css', '.scss', '.node'],
    symlinks: false,
    alias: {
      '@': path.join(__dirname, '../src'),
      'common': path.join(__dirname, '../common'),
      'chl': path.join(__dirname, '../src/js'),
      'three-examples': path.join(__dirname, '../node_modules/three/examples/js'),
      'models': path.join(__dirname, '../static/models'),
      'style': path.join(__dirname, '../src/style'),
      'vue$': 'vue/dist/vue.esm.js'
    },
  },
  target: 'electron-renderer'
}

/**
 * Adjust rendererConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  rendererConfig.plugins.push(
    new webpack.DefinePlugin({
      '__glslifyBasedir': `"${path.join(__dirname, '..').replace(/\\/g, '\\\\')}"`,
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
      '__schemas': `"${path.join(__dirname, '../../schemas').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  rendererConfig.devtool = ''

  rendererConfig.plugins.push(
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, '../static'),
        to: path.join(__dirname, '../dist/electron/static'),
        ignore: ['.*']
      },
        {
        from: path.join(__dirname, '../../schemas'),
        to: path.join(__dirname, '../dist/electron/schemas'),
        ignore: ['.*']
      }
    ]),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
}
module.exports = rendererConfig
