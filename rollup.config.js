import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './src/index.js',
  output: {
    file: 'dist/umd.es6.js',
    format: 'umd',
    name: 'observerUtil'
  },
  plugins: [
    resolve(),
    babel()
  ]
}
