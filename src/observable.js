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
  let observable = rawToProxy.get(obj)
  if (observable) {
    return observable
  }

  // if it is a special built-in object, instrument it
  // otherwise simply wrap the object with an observable Proxy
  let handlers = builtInHandlers.get(Object.getPrototypeOf(obj))
  if (handlers === false) {
    return obj
  }
  observable = new Proxy(obj, handlers || baseHandlers)
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
