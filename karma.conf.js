const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const babel = require('rollup-plugin-babel')
const coverage = require('rollup-plugin-coverage')
const alias = require('rollup-plugin-alias')
const path = require('path')

process.env.NODE_ENV = 'test'
const bundleType = process.env.BUNDLE_TYPE
const bundlePath = bundleType ? `dist/${bundleType}.js` : 'src/index.js'

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'chai', 'source-map-support'],
    files: ['tests/**/*.test.js'],
    reporters: bundleType ? ['progress'] : ['progress', 'coverage'],
    preprocessors: {
      'tests/**/*.test.js': ['rollup']
    },
    rollupPreprocessor: {
      plugins: [
        resolve(),
        commonjs({
          namedExports: {
            'node_modules/chai/index.js': ['expect']
          }
        }),
        alias({
          '@nx-js/observer-util': path.resolve(bundlePath)
        }),
        coverage({
          include: ['src/**/*.js']
        }),
        babel({
          exclude: 'node_modules/**'
        })
      ],
      format: 'iife',
      name: 'observer',
      sourcemap: 'inline'
    },
    coverageReporter: {
      dir: 'coverage',
      reporters: [{ type: 'lcov', subdir: '.' }, { type: 'text-summary' }]
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
