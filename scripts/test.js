const path = require('path')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const babel = require('rollup-plugin-babel')
const coverage = require('rollup-plugin-coverage')
const alias = require('rollup-plugin-alias')
const TestServer = require('karma').Server

const bundleName = process.env.BUNDLE
const bundlePath = bundleName ? `dist/${bundleName}` : 'src/index.js'

const config = {
  frameworks: ['mocha', 'chai', 'source-map-support'],
  reporters: ['mocha', 'coverage'],
  files: ['tests/**/*.test.js'],
  preprocessors: {
    'tests/**/*.test.js': ['rollup']
  },
  rollupPreprocessor: {
    plugins: [
      alias({
        '@yunfengdie/observer-util': path.resolve(bundlePath)
      }),
      babel({
        exclude: 'node_modules/**'
      }),
      resolve(),
      commonjs({
        namedExports: {
          'node_modules/chai/index.js': ['expect']
        }
      }),
      coverage({
        include: ['src/**/*.js']
      })
    ],
    output: {
      format: 'iife',
      name: 'observer',
      sourcemap: 'inline'
    }
  },
  coverageReporter: {
    dir: 'coverage',
    reporters: [{ type: 'lcov', subdir: '.' }, { type: 'text-summary' }]
  },
  port: 9876,
  colors: true,
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
}

const testServer = new TestServer(config, exitCode => {
  console.log(`Karma has exited with ${exitCode}`)
  process.exit(exitCode)
})
testServer.start()
