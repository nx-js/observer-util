const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const resolvePlugin = require('rollup-plugin-node-resolve')
const babelPlugin = require('rollup-plugin-babel')
const alias = require('rollup-plugin-alias')

const bundleType = process.env.BUNDLE
const bundlePath = bundleType ? `dist/${bundleType}.js` : 'src/index.js'

const config = {
  input: {
    input: path.resolve('debug/index.js'),
    plugins: [
      babelPlugin({
        exclude: 'node_modules/**'
      }),
      resolvePlugin(),
      alias({
        'nemo-observer-util': path.resolve(bundlePath)
      })
    ]
  },
  output: {
    format: 'iife'
  }
}

async function build () {
  // Compile source code into a distributable format with Babel and Rollup
  const bundle = await rollup.rollup(config.input)
  const { code } = await bundle.generate(config.output)
  const bundlePath = path.resolve('debug', 'dist.js')
  fs.writeFileSync(bundlePath, code, 'utf-8')
}

build()
