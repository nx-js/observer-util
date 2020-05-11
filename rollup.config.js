const path = require('path')
const resolvePlugin = require('rollup-plugin-node-resolve')
const babelPlugin = require('rollup-plugin-babel')
const externalsPlugin = require('rollup-plugin-auto-external')

export default {
  input: path.resolve('src/index.js'),
  plugins: [
    babelPlugin({
      exclude: 'node_modules/**'
    }),
    resolvePlugin(),
    externalsPlugin({ dependencies: true, peerDependecies: true })
  ],
  output: [
    {
      format: 'es',
      dir: 'dist',
      entryFileNames: 'bundle.es.js'
    },
    {
      format: 'cjs',
      dir: 'dist',
      entryFileNames: 'bundle.cjs.js'
    }
  ]
}
