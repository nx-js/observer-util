'use strict'

const native = WeakSet.prototype

const getters = ['has']
const setters = ['add', 'delete']
const all = [].concat(getters, setters)

module.exports = function shim (target, registerObserver, queueObservers) {
  target.$raw = {}

  for (let method of all) {
    target.$raw[method] = function () {
      native[method].apply(target, arguments)
    }
  }

  for (let getter of getters) {
    target[getter] = function (value) {
      registerObserver(this, value)
      return native[getter].apply(this, arguments)
    }
  }

  for (let setter of setters) {
    target[setter] = function (value) {
      queueObservers(this, value)
      return native[setter].apply(this, arguments)
    }
  }
  return traget
}
