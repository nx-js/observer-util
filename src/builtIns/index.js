import collectionHandlers from './collections'

// simple objects are not wrapped by Proxies, neither instrumented
const dontInstrument = new Set([Date, RegExp])

// built-in object can not be wrapped by Proxies
// their methods expect the object instance as the 'this' instead of the Proxy wrapper
// complex objects are wrapped with a Proxy of instrumented methods
// which switch the proxy to the raw object and to add reactive wiring
const handlers = new Map([
  [Map, collectionHandlers],
  [Set, collectionHandlers],
  [WeakMap, collectionHandlers],
  [WeakSet, collectionHandlers]
])

export function shouldInstrument (obj) {
  if (typeof Node === 'function' && obj instanceof Node) {
    return false
  }
  return !dontInstrument.has(obj.constructor)
}

export function getHandlers (obj) {
  return handlers.get(obj.constructor)
}
