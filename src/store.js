'use strict'

module.exports = {
  register,
  iterate
}

const hasOwnProp = Object.prototype.hasOwnProperty
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

function toSymbol (key) {
  let symbolKey = symbolKeys[key]
  if (!symbolKey) {
    symbolKeys[key] = symbolKey = Symbol()
  }
  return symbolKey
}

function getOwnProp (obj, key) {
  return (hasOwnProp.call(obj, key) && obj[key])
}
