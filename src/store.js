'use strict'

module.exports = {
  register,
  iterate,
  release
}

const getOwnProp = require('./getOwnProp')
const symbolKeys = Object.create(null)

function register (target, key, observer) {
  key = toSymbol(key)
  const observers = getOwnProp(target, key)
  if (observers !== observer) {
    if (!observers) {
      target[key] = observer
    } else if (observers instanceof Set) {
      observers.add(observer)
    } else {
      target[key] = new Set().add(observers).add(observer)
    }
    observer[key] = target
  }
}

function iterate (target, key, fn) {
  key = toSymbol(key)
  const observers = getOwnProp(target, key)
  if (observers instanceof Set) {
    observers.forEach(fn)
  } else if (observers) {
    fn(observers)
  }
}

function release (observer) {
  Object.getOwnPropertySymbols(observer).forEach(releaseKey, observer)
}

function releaseKey (key) {
  const target = this[key]
  unregister(target, key, this)
  this[key] = undefined
}

function unregister (target, key, observer) {
  const observers = getOwnProp(target, key)
  if (observers === observer || observers.size <= 1) {
    target[key] = undefined
  } else {
    observers.delete(observer)
  }
}

function toSymbol (key) {
  let symbolKey = symbolKeys[key]
  if (!symbolKey) {
    symbolKeys[key] = symbolKey = Symbol()
  }
  return symbolKey
}
