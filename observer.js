'use strict'

const nextTick = require('./nextTick')
const proxy = Symbol('observable proxy')
const unobservers = Symbol('unobservers')
const observing = Symbol('observing')

const observers = new WeakMap()
const queuedObservers = new Set()
let currentObserver

module.exports = {
  observe,
  unobserve,
  observable,
  isObservable
}

function observe (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  if (!fn[observing]) {
    fn[observing] = true
    fn[unobservers] = new Map()
    queueObserver(fn)
  }
}

function unobserve (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  if (fn[observing]) {
    fn[unobservers].forEach(runUnobserver)
    fn[unobservers] = undefined
  }
  fn[observing] = false
}

function observable (obj) {
  obj = obj || {}
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object or undefined')
  }
  if (isObservable(obj)) {
    return obj
  }
  if (typeof obj[proxy] === 'object') {
    return obj[proxy]
  }
  obj[proxy] = new Proxy(obj, {get, set, deleteProperty})
  observers.set(obj, new Map())
  return obj[proxy]
}

function isObservable (obj) {
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object')
  }
  return (obj[proxy] === true)
}

function get (target, key, receiver) {
  if (key === proxy) {
    return true
  }
  if (key === '$raw') {
    return target
  }
  const result = Reflect.get(target, key, receiver)
  if (currentObserver) {
    registerObserver(target, key, currentObserver)
    if (typeof result === 'object' && !(result instanceof Date)) {
      return observable(result)
    }
  }
  if (typeof result === 'object' && typeof result[proxy] === 'object') {
    return result[proxy]
  }
  return result
}

function registerObserver (target, key, observer) {
  let observersForKey = observers.get(target).get(key)
  if (!observersForKey) {
    observersForKey = new Set()
    observers.get(target).set(key, observersForKey)
  }
  if (!observersForKey.has(observer)) {
    observersForKey.add(observer)
    observer[unobservers].set(observersForKey, observer)
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
  if (queuedObservers.size === 0) {
    nextTick(runObservers)
  }
  queuedObservers.add(observer)
}

function runObservers () {
  try {
    queuedObservers.forEach(runObserver)
  } finally {
    queuedObservers.clear()
    currentObserver = undefined
  }
}

function runObserver (observer) {
  if (observer[observing]) {
    currentObserver = observer
    observer()
  }
}

function runUnobserver (observer, observers) {
  observers.delete(observer)
}
