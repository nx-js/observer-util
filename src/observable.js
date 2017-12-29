import { proxyToRaw, rawToProxy } from './internals'
import { storeObservable } from './store'
import builtInHandlers from './builtInHandlers'
import baseHandlers from './handlers'

export function observable (obj = {}) {
  if (typeof obj !== 'object') {
    throw new TypeError('Observable first argument must be an object or undefined')
  }
  // if it is already an observable, return it
  if (proxyToRaw.has(obj)) {
    return obj
  }
  // if it already has a cached observable wrapper, return it
  // otherwise create a new observable
  return rawToProxy.get(obj) || createObservable(obj)
}

function createObservable (obj) {
  const handlers = builtInHandlers.get(Object.getPrototypeOf(obj)) || baseHandlers
  // if it is a simple built-in object, do not wrap it
  if (handlers === true) {
    return obj
  }
  // if it is a complex built-in object or a normal object, wrap it
  const observable = new Proxy(obj, handlers)
  // save these to switch between the raw object and the wrapped object with ease later
  rawToProxy.set(obj, observable)
  proxyToRaw.set(observable, obj)
  // init basic data structures to save and cleanup later (observable.prop -> reaction) connections
  storeObservable(obj)
  return observable
}

export function isObservable (obj) {
  return proxyToRaw.has(obj)
}


export function raw (obj) {
  return proxyToRaw.get(obj) || obj
}
