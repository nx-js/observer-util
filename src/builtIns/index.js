'use strict'

const MapShim = require('./Map')
const SetShim = require('./Set')
const WeakMapShim = require('./WeakMap')
const WeakSetShim = require('./WeakSet')

module.exports = new Map([
  [Map.prototype, MapShim],
  [Set.prototype, SetShim],
  [WeakMap.prototype, WeakMapShim],
  [WeakSet.prototype, WeakSetShim],
  [Date.prototype, true],
  [RegExp.prototype, true]
])
