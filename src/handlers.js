import { observable } from './observable'
import { proxyToRaw, rawToProxy } from './internals'
import {
  registerRunningReactionForKey,
  queueReactionsForKey,
  hasRunningReaction
} from './reactionRunner'

const hasOwnProperty = Object.prototype.hasOwnProperty
const ENUMERATE = Symbol('enumerate')

// intercept get operations on observables to know which reaction uses their properties
function get (obj, key, receiver) {
  const result = Reflect.get(obj, key, receiver)
  // do not register (observable.prop -> reaction) pairs for these cases
  if (typeof key === 'symbol' || typeof result === 'function') {
    return result
  }
  // make sure to use the raw object here, obj might be a Proxy because of inheritance
  obj = proxyToRaw.get(obj) || obj
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForKey(obj, key)
  // if we are inside a reaction and observable.prop is an object wrap it in an observable too
  // this is needed to intercept property access on that object too (dynamic observable tree)
  if (hasRunningReaction() && typeof result === 'object' && result !== null) {
    return observable(result)
  }
  // otherwise return the observable wrapper if it is already created and cached or the raw object
  return rawToProxy.get(result) || result
}

function ownKeys (obj) {
  registerRunningReactionForKey(obj, ENUMERATE)
  return Reflect.ownKeys(obj)
}

// intercept set operations on observables to know when to trigger reactions
function set (obj, key, value, receiver) {
  // make sure to do not pollute the raw object with observables
  if (typeof value === 'object' && value !== null) {
    value = proxyToRaw.get(value) || value
  }
  // save if the object had a descriptor for this key
  const hadKey = hasOwnProperty.call(obj, key)
  // save if the value changed because of this set operation
  const valueChanged = value !== obj[key]
  // length is lazy, it can change without an explicit length set operation
  const prevLength = Array.isArray(obj) && obj.length
  // execute the set operation before running any reaction
  const result = Reflect.set(obj, key, value, receiver)
  // check if the length changed implicitly, because of out of bound set operations
  const lengthChanged = prevLength !== false && prevLength !== obj.length
  // emit a warning and do not queue anything when another reaction is queued
  // from an already running reaction
  if (hasRunningReaction()) {
    console.error(
      `Mutating observables in reactions is forbidden. You set ${key} to ${value}.`
    )
    return result
  }
  // if the target of the operation is not the raw receiver return
  // (possible because of prototypal inheritance)
  if (obj !== proxyToRaw.get(receiver)) {
    return result
  }
  // do not queue reactions if it is a symbol keyed property
  // or the set operation resulted in no value change
  if (typeof key !== 'symbol') {
    if (valueChanged) {
      queueReactionsForKey(obj, key)
    }
    if (!hadKey) {
      queueReactionsForKey(obj, ENUMERATE)
    }
    if (lengthChanged) {
      queueReactionsForKey(obj, 'length')
    }
  }
  return result
}

function deleteProperty (obj, key) {
  // save if the object had the key
  const hadKey = hasOwnProperty.call(obj, key)
  // execute the delete operation before running any reaction
  const result = Reflect.deleteProperty(obj, key)
  // only queue reactions for non symbol keyed property delete which resulted in an actual change
  if (typeof key !== 'symbol' && hadKey) {
    queueReactionsForKey(obj, key)
    queueReactionsForKey(obj, ENUMERATE)
  }
  return result
}

export default { get, ownKeys, set, deleteProperty }
