import { observable } from './observable'
import { proxyToRaw, rawToProxy } from './internals'
import { registerRunningReactionForKey, queueReactionsForKey, hasRunningReaction } from './reactionRunner'

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

export default { get, ownKeys, set, deleteProperty }
