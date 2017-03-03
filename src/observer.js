'use strict'

const nextTick = require('./nextTick')
const builtIns = require('./builtIns')
const store = require('./store')

const queuedObservers = new Set()
const enumerate = Symbol('enumerate')
let queued = false
let currentObserver
const handlers = {get, ownKeys, set, deleteProperty}
const proxyToRaw = new WeakMap()
const rawToProxy = new WeakMap()

module.exports = {
  observe,
  observable,
  isObservable,
  unobserve,
  unqueue,
  exec: runObserver
}

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
  rawToProxy.set(obj, observable)
  proxyToRaw.set(observable, obj)
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
  const rawTarget = proxyToRaw.get(target) || target
  if (key === '$raw') {
    return raw
  }
  const result = Reflect.get(target, key, receiver)
  if (typeof key === 'symbol') {
    return result
  }
  registerObserver(rawTarget, key)
  if (currentObserver && typeof result === 'object' && result) {
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
  registerObserver(target, enumerate)
  return Reflect.ownKeys(target)
}

function set (target, key, value, receiver) {
  if (typeof key !== 'symbol' && (key === 'length' || value !== Reflect.get(target, key, receiver))) {
    queueObservers(target, key)
    queueObservers(target, enumerate)
  }
  if (typeof value === 'object' && value) {
    value = proxyToRaw.get(value) || value
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  if (typeof key !== 'symbol' && Reflect.has(target, key)) {
    queueObservers(target, key)
    queueObservers(target, enumerate)
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
