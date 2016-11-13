'use strict'

const nextTick = require('./nextTick')
const unobservers = Symbol('unobservers')
const observing = Symbol('observing')

const objToProxy = new WeakMap()
const proxies = new WeakSet()
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
  if (proxies.has(obj)) {
    return obj
  }
  let observable = objToProxy.get(obj)
  if (!observable) {
    observable = new Proxy(obj, {get, set, deleteProperty})
    objToProxy.set(obj, observable)
    proxies.add(observable)
    observers.set(obj, new Map())
  }
  return observable
}

function isObservable (obj) {
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object')
  }
  return proxies.has(obj)
}

function get (target, key, receiver) {
  if (key === '$raw') {
    return target
  }
  const result = Reflect.get(target, key, receiver)
  if (currentObserver && typeof key !== 'symbol' && typeof result !== 'function') {
    registerObserver(target, key, currentObserver)
    if (typeof result === 'object') {
      return observable(result)
    }
  }
  if (typeof result === 'object') {
    return objToProxy.get(result) || result
  }
  return result
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
    observer[unobservers].set(observersForKey, observer)
  }
}

function set (target, key, value, receiver) {
  if ((key === 'length' || target[key] !== value) && objToProxy.get(target) === receiver) {
    const observersForKey = observers.get(target).get(key)
    if (observersForKey) {
      observersForKey.forEach(queueObserver)
    }
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
  try {
    queuedObservers.forEach(runObserver)
  } finally {
    queuedObservers.clear()
    queued = false
  }
}

function runObserver (observer) {
  if (observer[observing]) {
    try {
      currentObserver = observer
      observer()
    } finally {
      currentObserver = undefined
    }
  }
}

function runUnobserver (observer, observers) {
  observers.delete(observer)
}
