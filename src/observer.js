import nextTick from './nextTick'
import instrumentations from './builtIns/index'
import { storeObservable, storeObserver, iterateObservers, releaseObserver } from './store'
import { proxyToRaw, rawToProxy, UNOBSERVED } from './internals'

const ENUMERATE = Symbol('enumerate')
const queuedObservers = new Set()
let queued = false
let currentObserver
const handlers = { get, ownKeys, set, deleteProperty }

export function observe (observer) {
  if (typeof observer !== 'function') {
    throw new TypeError('Observer must be a function.')
  }
  observer[UNOBSERVED] = false
  runObserver(observer)
  return observer
}

export function unobserve (observer) {
  queuedObservers.delete(observer)
  observer[UNOBSERVED] = true
  releaseObserver(observer)
}

export function unqueue (observer) {
  queuedObservers.delete(observer)
}

export function exec (observer) {
  runObserver(observer)
}

export function isObservable (obj) {
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object')
  }
  return proxyToRaw.has(obj)
}

export function observable (obj) {
  obj = obj || {}
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object or undefined')
  }
  if (proxyToRaw.has(obj)) {
    return obj
  }
  return rawToProxy.get(obj) || instrumentObservable(obj) || createObservable(obj)
}

function instrumentObservable (obj) {
  const instrument = instrumentations.get(Object.getPrototypeOf(obj))
  if (typeof instrument === 'function') {
    instrument(obj)
  }
  if (instrument === false) {
    return obj
  }
}

function createObservable (obj) {
  const observable = new Proxy(obj, handlers)
  storeObservable(obj)
  proxyToRaw.set(observable, obj)
  rawToProxy.set(obj, observable)
  return observable
}

function get (target, key, receiver) {
  const rawTarget = proxyToRaw.get(target) || target
  if (key === '$raw') {
    return rawTarget
  }
  const result = Reflect.get(target, key, receiver)
  if (typeof key === 'symbol' || typeof result === 'function') {
    return result
  }
  registerObserver(rawTarget, key)
  if (currentObserver && typeof result === 'object' && result !== null) {
    return observable(result)
  }
  return rawToProxy.get(result) || result
}

export function registerObserver (target, key) {
  if (currentObserver) {
    storeObserver(target, key, currentObserver)
  }
}

function ownKeys (target) {
  registerObserver(target, ENUMERATE)
  return Reflect.ownKeys(target)
}

function set (target, key, value, receiver) {
  if (typeof value === 'object' && value !== null) {
    value = proxyToRaw.get(value) || value
  }
  if (typeof key === 'symbol' || target !== proxyToRaw.get(receiver)) {
    return Reflect.set(target, key, value, receiver)
  }
  if (key === 'length' || value !== target[key]) {
    queueObservers(target, key)
    queueObservers(target, ENUMERATE)
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  if (typeof key !== 'symbol' && (key in target)) {
    queueObservers(target, key)
    queueObservers(target, ENUMERATE)
  }
  return Reflect.deleteProperty(target, key)
}

export function queueObservers (target, key) {
  if (!queued) {
    nextTick(runObservers)
    queued = true
  }
  iterateObservers(target, key, queueObserver)
}

function queueObserver (observer) {
  if (!observer[UNOBSERVED]) {
    queuedObservers.add(observer)
  }
}

function runObservers () {
  queuedObservers.forEach(runObserver)
  queuedObservers.clear()
  queued = false
}

function runObserver (observer) {
  try {
    currentObserver = observer
    observer()
  } finally {
    currentObserver = undefined
  }
}
