import collectionHandlers from './collectionHandlers'

const globalObj =
  // eslint-disable-next-line no-new-func
  typeof window === 'object' ? window : Function('return this')()

// these stateful built-in objects can and should be wrapped by Proxies if they are part of a store
// simple ones - like arrays - ar wrapped with the normal observable Proxy
// complex ones - like Map and Set - are wrapped with a Proxy of instrumented methods
const handlers = new Map([
  [Map, collectionHandlers],
  [Set, collectionHandlers],
  [WeakMap, collectionHandlers],
  [WeakSet, collectionHandlers],
  [Object, false],
  [Array, false],
  [Int8Array, false],
  [Uint8Array, false],
  [Uint8ClampedArray, false],
  [Int16Array, false],
  [Uint16Array, false],
  [Int32Array, false],
  [Uint32Array, false],
  [Float32Array, false],
  [Float64Array, false]
])

// some (usually stateless) built-in objects can not be and should not be wrapped by Proxies
// their methods expect the object instance as the receiver ('this') instead of the Proxy wrapper
// wrapping them and calling their methods causes erros like: "TypeError: this is not a Date object."
export function shouldInstrument (obj) {
  const { constructor } = obj

  // functions and objects in the above handlers array are safe to instrument
  if (typeof obj === 'function' || handlers.has(constructor)) {
    return true
  }

  // other built-in objects should not be implemented
  const isBuiltIn =
    typeof constructor === 'function' &&
    constructor.name in globalObj &&
    globalObj[constructor.name] === constructor
  return !isBuiltIn
}

export function getHandlers (obj) {
  return handlers.get(obj.constructor)
}
