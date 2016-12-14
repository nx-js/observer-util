'use strict'

const native = Map.prototype
const masterKey = Symbol('Map master key')

const getters = ['has', 'get']
const setters = ['set', 'delete']
const iterators = ['forEach', 'keys', 'values', 'entries', Symbol.iterator]
const clearers = ['clear']
const all = [].concat(getters, setters, iterators, clearers)

module.exports = function shim (target, registerObserver, queueObservers) {
  target.$raw = {}

  for (let method of all) {
    target.$raw[method] = function () {
      native[method].apply(target, arguments)
    }
  }

  for (let getter of getters) {
    target[getter] = function (key) {
      registerObserver(this, key)
      return native[getter].apply(this, arguments)
    }
  }

  for (let iterator of iterators) {
    target[iterator] = function () {
      registerObserver(this, masterKey)
      return native[iterator].apply(this, arguments)
    }
  }

  for (let setter of setters) {
    target[setter] = function (key) {
      queueObservers(this, key)
      queueObservers(this, masterKey)
      return native[setter].apply(this, arguments)
    }
  }

  for (let clearer of clearers) {
    target[clearer] = function () {
      queueObservers(this, masterKey)
      return native[clearer].apply(this, arguments)
    }
  }
  return target
}
