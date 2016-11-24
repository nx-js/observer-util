'use strict'

const nextTick = require('./nextTick')

const proxies = new WeakMap()
const observers = new WeakMap()
const queuedObservers = new Set()
let queued = false
let currentObserver

module.exports = {
  observe,
  unobserve,
  observable,
  isObservable
}

const handlers = {get, set, deleteProperty}

function observe (fn, context, ...args) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  args = args.length ? args : undefined
  const observer = {fn, context, args, observedKeys: []}
  runObserver(observer)
  return observer
}

function unobserve (observer) {
  if (typeof observer === 'object' && observer.observedKeys) {
    observer.observedKeys.forEach(unobserveKey, observer)
    observer.fn = observer.context = observer.args = observer.observedKeys = undefined
  }
}

function observable (obj) {
  obj = obj || {}
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object or undefined')
  }
  return proxies.get(obj) || toObservable(obj)
}

function toObservable (obj) {
  const observable = new Proxy(obj, handlers)
  proxies.set(obj, observable)
  proxies.set(observable, observable)
  observers.set(obj, new Map())
  return observable
}

function isObservable (obj) {
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object')
  }
  return (proxies.get(obj) === obj)
}

function get (target, key, receiver) {
  if (key === '$raw') return target
  const result = Reflect.get(target, key, receiver)
  if (typeof key === 'symbol' || typeof result === 'function') {
    return result
  }
  const isObject = (typeof result === 'object' && result !== null)
  const observable = isObject && proxies.get(result)
  if (currentObserver) {
    registerObserver(target, key, currentObserver)
    if (isObject && result.constructor !== Date) {
      return observable || toObservable(result)
    }
  }
  return observable || result
}

function registerObserver (target, key, observer) {
  const observersForTarget = observers.get(target)
  let observersForKey = observersForTarget.get(key)
  if (!observersForKey) {
    observersForKey = new Set()
    observersForTarget.set(key, observersForKey)
  }
  if (!observersForKey.has(observer)) {
    observersForKey.add(observer)
    observer.observedKeys.push(observersForKey)
  }
}

function set (target, key, value, receiver) {
  const observersForKey = observers.get(target).get(key)
  if (observersForKey) {
    observersForKey.forEach(queueObserver)
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  const observersForKey = observers.get(target).get(key)
  if (observersForKey) {
    observersForKey.forEach(queueObserver)
  }
  return Reflect.deleteProperty(target, key)
}

function queueObserver (observer) {
  if (!queued) {
    nextTick(runObservers)
    queued = true
  }
  queuedObservers.add(observer)
}

function runObservers () {
  queuedObservers.forEach(runObserver)
  queuedObservers.clear()
  queued = false
}

function runObserver (observer) {
  if (observer.fn) {
    try {
      currentObserver = observer
      observer.fn.apply(observer.context, observer.args)
    } finally {
      currentObserver = undefined
    }
  }
}

function unobserveKey (observersForKey) {
  observersForKey.delete(this)
}
