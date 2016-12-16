'use strict'

const MapShim = require('./Map')
const SetShim = require('./Set')
const WeakMapShim = require('./WeakMap')
const WeakSetShim = require('./WeakSet')

module.exports = new Map([
  [Map, MapShim],
  [Set, SetShim],
  [WeakMap, WeakMapShim],
  [WeakSet, WeakSetShim],
  [Date, true],
  [RegExp, true]
])
