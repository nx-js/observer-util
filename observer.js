'use strict'

const OBSERVABLE = Symbol('OBSERVABLE')
const ON_CANCEL = Symbol('ON_CANCEL')
const CANCELLED = Symbol('CANCELLED')
let OBSERVER

module.exports = {
  observe,
  unobserve,
  observable,
  isObservable
}

const targets = new WeakMap()
const observerSet = new Set()

function observe (observer) {
  if (typeof observer !== 'function') throw new TypeError('first argument must be a function')

  observer[CANCELLED] = false
  observer[ON_CANCEL] = new Set()
  queueObserver(observer)
}

function unobserve (observer) {
  if (typeof observer !== 'function') throw new TypeError('first argument must be a function')

  observer[CANCELLED] = true
  if (observer[ON_CANCEL]) observer[ON_CANCEL].forEach(cancelObserver)
}

function cancelObserver (cancel) {
  cancel()
}

function queueObserver (observer) {
  if (observerSet.size === 0) setTimeout(runObservers)
  observerSet.add(observer)
}

function runObservers () {
  try {
    observerSet.forEach(runObserver)
  } finally {
    OBSERVER = undefined
    observerSet.clear()
  }
}

function runObserver (observer) {
  if (!observer[CANCELLED]) {
    OBSERVER = observer
    observer()
  }
}

function get (target, key, receiver) {
  if (key === OBSERVABLE) return true
  const result = Reflect.get(target, key, receiver)

  if (OBSERVER !== undefined) {
    if (!targets.get(target).has(key)) targets.get(target).set(key, new Set())
    OBSERVER[ON_CANCEL].add(() => targets.get(target).get(key).delete(OBSERVER))
    targets.get(target).get(key).add(OBSERVER)
    if (typeof result === 'object') return observable(result)
  }

  if (typeof result === 'object' && typeof result[OBSERVABLE] === 'object') {
    return result[OBSERVABLE]
  }
  return result
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

function observable (target = {}) {
  if (typeof target !== 'object') throw new TypeError('first argument must be an object or undefined')
  if (typeof target[OBSERVABLE] === 'object') return target[OBSERVABLE]
  if (target[OBSERVABLE] === true) return target

  target[OBSERVABLE] = new Proxy(target, {get, set, deleteProperty})
  targets.set(target, new Map())
  return target[OBSERVABLE]
}

function isObservable (observable) {
  if (typeof observable !== 'object') throw new TypeError('first argument must be an object')

  return (observable[OBSERVABLE] === true)
}
