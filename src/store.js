'use strict'

module.exports = {
  register,
  iterate,
  release
}

const hasOwnProperty = Object.prototype.hasOwnProperty
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
  for (let key of Object.getOwnPropertySymbols(observer)) {
    const target = observer[key]
    unregister(target, key, observer)
    delete observer[key]
  }
}

function unregister (target, key, observer) {
  const observers = getOwnProp(target, key)
  if (observers === observer) {
    delete target[key]
  } else if (observers) {
    observers.delete(observer)
  }
}

function toSymbol (key) {
  let symbolKey = symbolKeys[key]
  if (!symbolKey) {
    symbolKey = Symbol()
    symbolKeys[key] = symbolKey
  }
  return symbolKey
}

function getOwnProp (target, key) {
  return hasOwnProperty.call(target, key) && target[key]
}
