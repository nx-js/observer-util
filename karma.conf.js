const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const babel = require('rollup-plugin-babel')
const coverage = require('rollup-plugin-coverage')

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'chai', 'source-map-support'],
    files: ['test/**/*.test.js'],
    reporters: ['progress', 'coverage'],
    preprocessors: {
      'test/**/*.test.js': ['rollup']
    },
    rollupPreprocessor: {
      plugins: [
        resolve(),
        commonjs({
          namedExports: {
            'node_modules/chai/index.js': ['expect']
          }
        }),
        coverage({
          include: ['src/**/*.js']
        }),
        babel({
          exclude: 'node_modules/**'
        })
      ],
      format: 'iife',
      name: 'observerUtil',
      sourcemap: 'inline'
    },
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    concurrency: Infinity,
    singleRun: true,
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    }
  })
}
