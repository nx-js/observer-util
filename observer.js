'use strict'

const nextTick = require('./nextTick')
const proxy = Symbol('proxy')
const unobserverSet = Symbol('unobserverSet')
const observing = Symbol('observing')

const targets = new WeakMap()
const observerSet = new Set()
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
    fn[unobserverSet] = new Set()
    runObserver(fn)
  }
}

function unobserve (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  if (fn[observing]) {
    fn[unobserverSet].forEach(runUnobserver)
    fn[unobserverSet] = undefined
  }
  fn[observing] = false
}

function observable (obj) {
  if (obj === undefined) {
    obj = {}
  }
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object or undefined')
  }
  if (isObservable(obj)) {
    return obj
  }
  if (typeof obj[proxy] === 'object') {
    return obj[proxy]
  }
  obj[proxy] = new Proxy(obj, {get: get, set: set, deleteProperty: deleteProperty})
  targets.set(obj, new Map())
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
  } else if (key === '$raw') {
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
  let observersForKey = targets.get(target).get(key)
  if (!observersForKey) {
    observersForKey = new Set()
    targets.get(target).set(key, observersForKey)
  }
  if (!observersForKey.has(observer)) {
    observersForKey.add(observer)
    observer[unobserverSet].add(() => observersForKey.delete(observer))
  }
}

function set (target, key, value, receiver) {
  if (targets.get(target).has(key)) {
    targets.get(target).get(key).forEach(queueObserver)
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  if (targets.get(target).has(key)) {
    targets.get(target).get(key).forEach(queueObserver)
  }
  return Reflect.deleteProperty(target, key)
}

function queueObserver (observer) {
  if (observerSet.size === 0) {
    nextTick(runObservers)
  }
  observerSet.add(observer)
}

function runObservers () {
  try {
    observerSet.forEach(runObserver)
  } finally {
    observerSet.clear()
  }
}

function runObserver (observer) {
  if (observer[observing]) {
    currentObserver = observer
    try {
      observer()
    } finally {
      currentObserver = undefined
    }
  }
}

function runUnobserver (unobserver) {
  unobserver()
}
