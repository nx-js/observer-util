'use strict'

const nextTick = require('./nextTick')
const builtIns = require('./builtIns')
const wellKnowSymbols = require('./wellKnownSymbols')

const proxies = new WeakMap()
const queuedObservers = new Set()
const observers = Symbol('observers')
const enumerate = Symbol('enumerate')
let queued = false
let currentObserver
const handlers = {get, ownKeys, set, deleteProperty}

module.exports = {
  observe,
  observable,
  isObservable,
  unobserve,
  unqueue,
  exec: runObserver
}

function observe (observer) {
  observer.observedKeys = []
  runObserver(observer)
  return observer
}

function unobserve (observer) {
  observer.observedKeys && observer.observedKeys.forEach(unobserveKey, observer)
  observer.fn = observer.ctx = observer.args = observer.observedKeys = undefined
  queuedObservers.delete(observer)
}

function unqueue () {
  queuedObservers.delete(observer)
}

function observable (obj) {
  obj = obj || {}
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object or undefined')
  }
  return proxies.get(obj) || toObservable(obj)
}

function toObservable (obj) {
  const observable = createObservable(obj)
  proxies.set(obj, observable)
  proxies.set(observable, observable)
  obj[observers] = Object.create(null)
  return observable
}

function createObservable (obj) {
  const builtIn = builtIns.get(obj.constructor)
  if (!builtIn) {
    return new Proxy(obj, handlers)
  }
  if (typeof builtIn === 'function') {
    return builtIn(obj, registerObserver, queueObservers)
  }
  return obj
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
  if (typeof key === 'symbol' && wellKnowSymbols.has(key)) {
    return result
  }
  const isObject = (typeof result === 'object' && result)
  const observable = isObject && proxies.get(result)
  if (currentObserver) {
    registerObserver(target, key)
    if (isObject) {
      return observable || toObservable(result)
    }
  }
  return observable || result
}

function registerObserver (target, key) {
  if (currentObserver) {
    const observersForTarget = target[observers]
    let observersForKey = observersForTarget[key]
    if (!observersForKey) {
      observersForKey = new Set()
      observersForTarget[key] = observersForKey
    }
    if (!observersForKey.has(currentObserver)) {
      observersForKey.add(currentObserver)
      currentObserver.observedKeys.push(observersForKey)
    }
  }
}

function ownKeys (target) {
  registerObserver(target, enumerate)
  return Reflect.ownKeys(target)
}

function set (target, key, value, receiver) {
  if (key === 'length' || value !== Reflect.get(target, key, receiver)) {
    queueObservers(target, key)
    queueObservers(target, enumerate)
  }
  if (typeof value === 'object' && value) {
    value = value.$raw || value
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  if (Reflect.has(target, key)) {
    queueObservers(target, key)
    queueObservers(target, enumerate)
  }
  return Reflect.deleteProperty(target, key)
}

function queueObservers (target, key) {
  const observersForKey = target[observers][key]
  if (observersForKey) {
    observersForKey.forEach(queueObserver)
  }
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
  try {
    currentObserver = observer
    const fn = observer.fn || observer
    fn.apply(observer.ctx, observer.args)
  } finally {
    currentObserver = undefined
  }
}

function unobserveKey (observersForKey) {
  observersForKey.delete(this)
}
