'use strict'

const nextTick = require('./nextTick')
const builtIns = require('./builtIns')
const store = require('./store')

const ENUMERATE = Symbol('enumerate')
const queuedObservers = new Set()
const proxyToRaw = new WeakMap()
const rawToProxy = new WeakMap()
let queued = false
let currentObserver
const handlers = {get, ownKeys, set, deleteProperty}

exports.observe = observe
exports.observable = observable
exports.isObservable = isObservable
exports.unobserve = unobserve
exports.unqueue = unqueue
exports.exec = runObserver

function observe (observer) {
  runObserver(observer)
  return observer
}

function unobserve (observer) {
  store.release(observer)
  queuedObservers.delete(observer)
  observer.fn = observer.ctx = observer.args = undefined
}

function unqueue (observer) {
  queuedObservers.delete(observer)
}

function observable (obj) {
  obj = obj || {}
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object or undefined')
  }
  if (proxyToRaw.has(obj)) {
    return obj
  }
  return rawToProxy.get(obj) || toObservable(obj)
}

function toObservable (obj) {
  const observable = createObservable(obj)
  proxyToRaw.set(observable, obj)
  rawToProxy.set(obj, observable)
  return observable
}

function createObservable (obj) {
  const builtIn = builtIns.get(Object.getPrototypeOf(obj))
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
  return proxyToRaw.has(obj)
}

function get (target, key, receiver) {
  if (key === '$raw') {
    return proxyToRaw.get(target) || target
  }
  const result = Reflect.get(target, key, receiver)
  if (typeof key === 'symbol' || typeof result === 'function') {
    return result
  }
  registerObserver(target, key)
  if (currentObserver && result && typeof result === 'object') {
    return observable(result)
  }
  return rawToProxy.get(result) || result
}

function registerObserver (target, key) {
  if (currentObserver) {
    store.register(target, key, currentObserver)
  }
}

function ownKeys (target) {
  registerObserver(target, ENUMERATE)
  return Reflect.ownKeys(target)
}

function set (target, key, value, receiver) {
  if (typeof value === 'object' && value) {
    value = proxyToRaw.get(value) || value
  }
  const oldValue = Reflect.get(target, key, receiver)
  if (typeof key !== 'symbol' && (key === 'length' || value !== oldValue)) {
    queueObservers(target, key)
    queueObservers(target, ENUMERATE)
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  if (typeof key !== 'symbol' && Reflect.has(target, key)) {
    queueObservers(target, key)
    queueObservers(target, ENUMERATE)
  }
  return Reflect.deleteProperty(target, key)
}

function queueObservers (target, key) {
  store.iterate(target, key, queueObserver)
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
