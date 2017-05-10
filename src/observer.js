'use strict'

const nextTick = require('./nextTick')
const builtIns = require('./builtIns')
const store = require('./store')
const getOwnProp = require('./getOwnProp')

const queuedObservers = new Set()
const enumerate = Symbol('enumerate')
const proxy = Symbol('proxy')
const raw = Symbol('raw')
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
  return getOwnProp(obj, proxy) || toObservable(obj)
}

function toObservable (obj) {
  const observable = createObservable(obj)
  obj[proxy] = observable
  obj[raw] = obj
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
  return (getOwnProp(obj, proxy) === obj)
}

function get (target, key, receiver) {
  if (key === '$raw') {
    return getOwnProp(target, raw)
  }
  const result = Reflect.get(target, key, receiver)
  if (typeof key === 'symbol' || typeof result === 'function') {
    return result
  }
  registerObserver(target, key)
  const isObject = (typeof result === 'object' && result)
  const observable = isObject && getOwnProp(result, proxy)
  if (currentObserver && isObject) {
    return observable || toObservable(result)
  }
  return observable || result
}

function registerObserver (target, key) {
  if (currentObserver) {
    const rawTarget = getOwnProp(target, raw)
    store.register(target, key, currentObserver)
  }
}

function ownKeys (target) {
  registerObserver(target, enumerate)
  return Reflect.ownKeys(target)
}

function set (target, key, value, receiver) {
  // why is the old value not a proxy
  const oldValue = Reflect.get(target, key, receiver)
  if (typeof value === 'object' && value) {
    value = getOwnProp(value, raw) || value
  }
  if (getOwnProp(receiver, raw) === target && typeof key !== 'symbol' && (key === 'length' || value !== oldValue)) {
    queueObservers(target, key)
    queueObservers(target, enumerate)
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
  } finally { // consider a catch here, finally behaves strangely and swallows things!
    currentObserver = undefined
  }
}
