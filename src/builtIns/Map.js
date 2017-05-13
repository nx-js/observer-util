'use strict'

const native = Map.prototype
const ITERATE = Symbol('iterate map')

const getters = ['has', 'get']
const iterators = ['forEach', 'keys', 'values', 'entries', Symbol.iterator]
const all = ['set', 'delete', 'clear'].concat(getters, iterators)

module.exports = function shim (target, registerObserver, queueObservers) {
  target.$raw = {}

  for (let method of all) {
    target.$raw[method] = function () {
      return native[method].apply(target, arguments)
    }
  }

  Object.defineProperty(target.$raw, 'size', {
    get: () => Reflect.get(native, 'size', target)
  })

  Object.defineProperty(target, 'size', {
    get: function () {
      registerObserver(target, ITERATE)
      return Reflect.get(native, 'size', target)
    }
  })

  for (let getter of getters) {
    target[getter] = function (key) {
      registerObserver(this, key)
      return native[getter].apply(this, arguments)
    }
  }

  for (let iterator of iterators) {
    target[iterator] = function () {
      registerObserver(this, ITERATE)
      return native[iterator].apply(this, arguments)
    }
  }

  target.set = function (key, value) {
    if (this.get(key) !== value) {
      queueObservers(this, key)
      queueObservers(this, ITERATE)
    }
    return native.set.apply(this, arguments)
  }

  target.delete = function (key) {
    if (this.has(key)) {
      queueObservers(this, key)
      queueObservers(this, ITERATE)
    }
    return native.delete.apply(this, arguments)
  }

  target.clear = function () {
    if (this.size) {
      queueObservers(this, ITERATE)
    }
    return native.clear.apply(this, arguments)
  }

  return target
}
