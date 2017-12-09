import nextTick from './nextTick'
import instrumentations from './builtIns'
import {
  storeObservable,
  storeReaction,
  registerReactionForKey,
  iterateReactionsForKey,
  releaseReaction
} from './store'
import { proxyToRaw, rawToProxy } from './internals'

const ENUMERATE = Symbol('enumerate')
const queuedReactions = new Set()
let runningReaction
const handlers = { get, ownKeys, set, deleteProperty }

export function observe (reaction) {
  if (typeof reaction !== 'function') {
    throw new TypeError('Reactions must be functions.')
  }
  // init basic data structures to save and cleanup (observable.prop -> reaction) connections later
  storeReaction(reaction)
  // run the reaction once to discover what observable properties it uses
  runReaction(reaction)
  return reaction
}

export function unobserve (reaction) {
  // do not run this reaction anymore, even if it is already queued
  queuedReactions.delete(reaction)
  // release every (observable.prop -> reaction) connections
  releaseReaction(reaction)
}

export function unqueue (reaction) {
  // do not run this reaction, if it is not queued again by a prop mutation
  queuedReactions.delete(reaction)
}

export function exec (reaction) {
  runReaction(reaction)
}

export function isObservable (obj) {
  if (typeof obj !== 'object') {
    throw new TypeError('First argument must be an object')
  }
  return proxyToRaw.has(obj)
}

export function observable (obj) {
  obj = obj || {}
  if (typeof obj !== 'object') {
    throw new TypeError('First argument must be an object or undefined')
  }
  // if it is already an observable, return it
  if (proxyToRaw.has(obj)) {
    return obj
  }
  return (
    // if it already has a cached observable wrapper, return it
    // if it is a special built-in object, instrument it then wrap it with an observable
    // otherwise simply wrap the object with an observable
    rawToProxy.get(obj) || instrumentObservable(obj) || createObservable(obj)
  )
}

function isDomNode (obj) {
  return Node && obj instanceof Node
}

function instrumentObservable (obj) {
  const instrument = instrumentations.get(Object.getPrototypeOf(obj))
  // these objects break, when they are wrapped with proxies
  if (instrument === false || isDomNode(obj)) {
    return obj
  }
  // these objects can be wrapped by Proxies, but require special instrumentation beforehand
  if (typeof instrument === 'function') {
    instrument(obj)
  }
}

// wrap the object in a Proxy and save the obj-proxy, proxy-obj pairs
function createObservable (obj) {
  const observable = new Proxy(obj, handlers)
  // init basic data structures to save and cleanup later (observable.prop -> reaction) connections
  storeObservable(obj)
  // save these to switch between the raw object and the wrapped object with ease later
  proxyToRaw.set(observable, obj)
  rawToProxy.set(obj, observable)
  return observable
}

// intercept get operations on observables to know which reaction uses their properties
function get (obj, key, receiver) {
  // make sure to use the raw object here
  const rawObj = proxyToRaw.get(obj) || obj
  // expose the raw object on observable.$raw
  if (key === '$raw') {
    return rawObj
  }
  const result = Reflect.get(obj, key, receiver)
  // do not register (observable.prop -> reaction) pairs for these cases
  if (typeof key === 'symbol' || typeof result === 'function') {
    return result
  }
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForKey(rawObj, key)
  // if we are inside a reaction and observable.prop is an object wrap it in an observable too
  // this is needed to intercept property access on that object too (dynamic observable tree)
  if (runningReaction && typeof result === 'object' && result !== null) {
    return observable(result)
  }
  // otherwise return the observable wrapper if it is already created and cached or the raw object
  return rawToProxy.get(result) || result
}

function ownKeys (obj) {
  registerRunningReactionForKey(obj, ENUMERATE)
  return Reflect.ownKeys(obj)
}

// register the currently running reaction to be queued again on obj.key mutations
export function registerRunningReactionForKey (obj, key) {
  if (runningReaction) {
    registerReactionForKey(obj, key, runningReaction)
  }
}

// intercept set operations on observables to know when to trigger reactions
function set (obj, key, value, receiver) {
  // make sure to do not pollute the raw object with observables
  if (typeof value === 'object' && value !== null) {
    value = proxyToRaw.get(value) || value
  }
  // do not register reactions if it is a symbol keyed property
  // or if the target of the operation is not the raw object (possible because of prototypal inheritance)
  if (typeof key === 'symbol' || obj !== proxyToRaw.get(receiver)) {
    return Reflect.set(obj, key, value, receiver)
  }
  // only queue reactions if the set operation resulted in a value change
  // array 'length' property is an exception from this, because of it's exotic nature
  if (key === 'length' || value !== obj[key]) {
    queueReactionsForKey(obj, key)
    queueReactionsForKey(obj, ENUMERATE)
  }
  return Reflect.set(obj, key, value, receiver)
}

function deleteProperty (obj, key) {
  // only queue reactions for non symbol keyed property delete which resulted in an actual change
  if (typeof key !== 'symbol' && key in obj) {
    queueReactionsForKey(obj, key)
    queueReactionsForKey(obj, ENUMERATE)
  }
  return Reflect.deleteProperty(obj, key)
}

export function queueReactionsForKey (obj, key) {
  // register a new reaction running task, if there are no reactions queued yet
  if (!queuedReactions.size) {
    nextTick(runQueuedReactions)
  }
  // iterate and queue every reaction, which is triggered by obj.key mutation
  iterateReactionsForKey(obj, key, queueReaction)
}

function queueReaction (reaction) {
  queuedReactions.add(reaction)
}

function runQueuedReactions () {
  queuedReactions.forEach(runReaction)
  queuedReactions.clear()
}

// set the reaction as the currently running one
// this is required so that we can create (observable.prop -> reaction) pairs in the get trap
function runReaction (reaction) {
  try {
    runningReaction = reaction
    reaction()
  } finally {
    // always remove the currently running flag from the reaction when it stops execution
    runningReaction = undefined
  }
}
