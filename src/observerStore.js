'use strict'

const getOwnProperty = require('./getOwnProperty')

module.exports = {
  register,
  unregister,
  forEach
}
const observerKeys = Object.create(null)

function register (target, key, observer) {
  const observerKey = getObserverKey(key)
  addObserver(target, observerKey, observer)
}

function unregister (observerKey, target) {
  const observers = target[observerKey]
  const observer = this
  if (observers === observer) {
    target[observerKey] = undefined
  } else if (observers) {
    observers.delete(observer)
  }
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
  const observers = getOwnProperty(target, observerKey)
  if (observers !== observer) {
    if (!observers) {
      target[observerKey] = observer
    } else if (observers.constructor === Set) {
      observers.add(observer)
    } else {
      target[observerKey] = new Set([observers, observer])
    }
    observer.targets.set(target, observerKey)
  }
}
