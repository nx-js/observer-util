'use strict'

module.exports = {
  register,
  unregister,
  forEach
}

const hasOwnProperty = Object.prototype.hasOwnProperty
const observerKeys = Object.create(null)

function register (target, key, observer) {
  const observerKey = getObserverKey(key)
  addObserver(target, observerKey, observer)
  // add cleanup logic too!
}

function unregister (target, observerKey) {

}

function forEach (target, key, fn) {
  const observerKey = getObserverKey(key)
  const observers = hasOwnProperty.call(target, observerKey) && target[observerKey]
  if (observers) {
    if (observers.constructor === Set) {
      observers.forEach(fn)
    } else {
      fn(observers)
    }
  }
}

function getObserverKey (key) {
  let observerKey = observerKeys[key]
  if (!observerKey) {
    observerKey = observerKeys[key] = Symbol()
  }
  return observerKey
}

function addObserver (target, observerKey, observer) {
  if (!hasOwnProperty.call(target, observerKey)) {
    return target[observerKey] = observer
  }
  const observers = target[observerKey]
  if (observers !== observer) {
    if (observers.constructor === Set) {
      observers.add(observer)
    } else {
      target[observerKey] = new Set([observers, observer])
    }
  }
}
