'use strict'

const native = WeakMap.prototype

const getters = ['has', 'get']
const setters = ['set', 'delete']
const all = [].concat(getters, setters)

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

  for (let setter of setters) {
    target[setter] = function (key) {
      queueObservers(this, key)
      return native[setter].apply(this, arguments)
    }
  }
  return target
}
