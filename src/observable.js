import { proxyToRaw, rawToProxy } from './internals'
import instrumentations from './builtIns'
import { storeObservable } from './store'
import handlers from './handlers'

export function isObservable (obj) {
  if (typeof obj !== 'object') {
    throw new TypeError('First argument must be an object')
  }
  return proxyToRaw.has(obj)
}

export function observable (obj = {}) {
  if (typeof obj !== 'object') {
    throw new TypeError('Observable first argument must be an object or undefined')
  }
  // if it is already an observable, return it
  if (proxyToRaw.has(obj)) {
    return obj
  }
  return (
    // if it already has a cached observable wrapper, return it
    // if it is a special built-in object, instrument it then wrap it with an observable
    // otherwise simply wrap the object with an observable
    rawToProxy.get(obj) || instrumentObservable(obj) || createObservable(obj)
  )
}

function instrumentObservable (obj) {
  const instrument = instrumentations.get(Object.getPrototypeOf(obj))
  // these objects break, when they are wrapped with proxies
  if (instrument === false) {
    return obj
  }
  // these objects can be wrapped by Proxies, but require special instrumentation beforehand
  if (typeof instrument === 'function') {
    instrument(obj)
  }
}

// wrap the object in a Proxy and save the obj-proxy, proxy-obj pairs
function createObservable (obj) {
  const observable = new Proxy(obj, handlers)
  // init basic data structures to save and cleanup later (observable.prop -> reaction) connections
  storeObservable(obj)
  // save these to switch between the raw object and the wrapped object with ease later
  proxyToRaw.set(observable, obj)
  rawToProxy.set(obj, observable)
  return observable
}
