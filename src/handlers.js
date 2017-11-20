import { observable } from './observable'
import { proxyToRaw, rawToProxy } from './internals'
import {
  registerRunningReactionForKey,
  queueReactionsForKey,
  hasRunningReaction
} from './reactionRunner'

const ENUMERATE = Symbol('enumerate')

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
  // save if the value changed because of this set operation
  // array 'length' is an exception here, because of it's exotic nature
  const valueChanged = (key === 'length' || value !== obj[key])
  // execute the set operation before running any reaction
  const result = Reflect.set(obj, key, value, receiver)
  // emit a warning and do not queue anything when another reaction is queued
  // from an already running reaction
  if (hasRunningReaction()) {
    console.error(`Mutating observables in reactions is forbidden. You tried to set ${key} to ${value}`)
    return result
  }
  // do not queue reactions if it is a symbol keyed property
  // or the set operation resulted in no value change
  // or if the target of the operation is not the raw object (possible because of prototypal inheritance)
  if (typeof key !== 'symbol' && valueChanged && obj === proxyToRaw.get(receiver)) {
    queueReactionsForKey(obj, key)
    queueReactionsForKey(obj, ENUMERATE)
  }
  return result
}

function deleteProperty (obj, key) {
  // save if the object had the key
  const hadKey = (key in obj)
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
