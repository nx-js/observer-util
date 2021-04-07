import { proxyToRaw, rawToProxy, rawToOptions } from './internals'
import { storeObservable } from './store'
import * as builtIns from './builtIns'
import proxyHandlers from './proxyHandlers'

export function observable (obj = {}, options) {
  // if it is already an observable or it should not be wrapped, return it
  if (proxyToRaw.has(obj) || !builtIns.shouldInstrument(obj)) {
    return obj
  }
  // if it already has a cached observable wrapper, return it
  // otherwise create a new observable
  return rawToProxy.get(obj) || createObservable(obj, options)
}

function createObservable (obj, options) {
  // if it is a complex built-in object or a normal object, wrap it
  const baseHandlers = builtIns.getHandlers(obj) || proxyHandlers
  const observable = new Proxy(obj, {
    ...options?.proxyHandlers,
    ...baseHandlers
  })
  // save these to switch between the raw object and the wrapped object with ease later
  rawToProxy.set(obj, observable)
  proxyToRaw.set(observable, obj)

  // add custom options to the raw object
  if (options) {
    rawToOptions.set(obj, options)
  }

  // init basic data structures to save and cleanup later (observable.prop -> reaction) connections
  storeObservable(obj)
  return observable
}

// if observable.prop is an object, wrap it in an observable too
// this is needed to intercept property access on that object too
export function observableChild (child, parent) {
  if (
    (typeof child === 'object' && child !== null) ||
    typeof child === 'function'
  ) {
    // pass the parent's options to the child object
    // this creates a 'deep proxy' which shares custom handlers deeply with its object children
    const options = rawToOptions.get(parent)
    return observable(child, options)
  }
  return child
}

export function isObservable (obj) {
  return proxyToRaw.has(obj)
}

export function raw (obj) {
  return proxyToRaw.get(obj) || obj
}
