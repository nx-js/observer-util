'use strict'

const nextTick = require('./nextTick')
const builtIns = require('./builtIns')
const observerStore = require('./observerStore')
const getOwnProperty = require('./getOwnProperty')

const queuedObservers = new Set()
const enumerate = Symbol('enumerate')
let queued = false
let currentObserver
const handlers = {get, ownKeys, set, deleteProperty}
const hasOwnProperty = Object.prototype.hasOwnProperty
const raw = Symbol('raw observable')
const proxy = Symbol('observable proxy')

module.exports = {
  observe,
  observable,
  isObservable,
  unobserve,
  unqueue,
  exec: runObserver
}

function observe (observer) {
  if (typeof observer === 'function') {
    observer = { fn: observer }
  }
  observer.targets = new Map()
  runObserver(observer)
  return observer
}

function unobserve (observer) {
  observer.targets && observer.targets.forEach(observerStore.unregister, observer)
  observer.fn = observer.ctx = observer.args = observer.targets = undefined
  queuedObservers.delete(observer)
}

function unqueue (observer) {
  queuedObservers.delete(observer)
}

function observable (obj) {
  obj = obj || {}
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object or undefined')
  }
  return getOwnProperty(obj, proxy) || toObservable(obj)
}

function toObservable (obj) {
  const observable = createObservable(obj)
  obj[proxy] = observable
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
  return (getOwnProperty(obj, proxy) === obj)
}

function get (target, key, receiver) {
  if (key === raw || key === '$raw') {
    return target
  }
  const result = Reflect.get(target, key, receiver)
  if (typeof key === 'symbol') {
    return result
  }
  const isObject = (typeof result === 'object' && result)
  const observable = isObject && getOwnProperty(result, proxy)
  if (currentObserver) {
    observerStore.register(target, key, currentObserver)
    if (isObject) {
      return observable || toObservable(result)
    }
  }
  return observable || result
}

function registerObserver (target, key) {
  currentObserver && observerStore.register(target, key, currentObserver)
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
    // this walks the prototype chain and it is bad!!
    value = value[raw] || value
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
  observerStore.forEach(target, key, queueObserver)
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
