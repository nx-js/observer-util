'use strict'

const nextTick = require('./nextTick')
const builtIns = require('./builtIns')
const wellKnowSymbols = require('./wellKnownSymbols')

const proxies = new WeakMap()
const observers = new WeakMap()
const queuedObservers = new Set()
let queued = false
let currentObserver

const configObj = { mode: 'sync_once', alwaysTrigger: false }
const validModes = ['sync_once', 'async']
const validTriggers = [true, false]
const handlers = {get, set, deleteProperty}

module.exports = {
  observe,
  unobserve,
  observable,
  isObservable,
  config
}

function observe (fn, context, ...args) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  args = args.length ? args : undefined
  const observer = {fn, context, args, observedKeys: []}
  if (configObj.mode === 'async') {
    queueObserver(observer)
  } else {
    runObserver(observer)
  }
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
  let observable
  const builtIn = builtIns.get(obj.constructor)
  if (typeof builtIn === 'function') {
    observable = builtIn(obj, registerObserver, queueObservers)
  } else if (!builtIn) {
    observable = new Proxy(obj, handlers)
  } else {
    observable = obj
  }
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
    const observersForTarget = observers.get(target)
    let observersForKey = observersForTarget.get(key)
    if (!observersForKey) {
      observersForKey = new Set()
      observersForTarget.set(key, observersForKey)
    }
    if (!observersForKey.has(currentObserver)) {
      observersForKey.add(currentObserver)
      currentObserver.observedKeys.push(observersForKey)
    }
  }
}

function set (target, key, value, receiver) {
  if (configObj.alwaysTrigger || key === 'length' || value !== Reflect.get(target, key, receiver)) {
    queueObservers(target, key)
  }
  if (typeof value === 'object' && value) {
    value = value.$raw || value
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  queueObservers(target, key)
  return Reflect.deleteProperty(target, key)
}

function queueObservers (target, key) {
  const observersForKey = observers.get(target).get(key)
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

function config (obj) {
  configObj.mode = obj.mode || configObj.mode
  if (validModes.indexOf(configObj.mode) === -1) {
    throw new Error (`Invalid mode config: ${configObj.mode}. Valid values are: ${validModes.join(', ')}`)
  }
  if (validTriggers.indexOf(obj.alwaysTrigger) !== -1) {
    configObj.alwaysTrigger = obj.alwaysTrigger
  } else if (obj.alwaysTrigger !== undefined) {
    throw new Error (`Invalid alwaysTrigger config: ${configObj.mode}. Valid values are: ${validTriggers.join(', ')}`)
  }
}
