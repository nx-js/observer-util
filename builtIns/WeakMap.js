'use strict'

const native = WeakMap.prototype

const getters = ['has', 'get']
const all = ['set', 'delete'].concat(getters)

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

  target.set = function (key, value) {
    if (this.get(key) !== value) {
      queueObservers(this, key)
    }
    return native.set.apply(this, arguments)
  }

  target.delete = function (key) {
    if (this.has(key)) {
      queueObservers(this, key)
    }
    return native.delete.apply(this, arguments)
  }

  return target
}
