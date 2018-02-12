import { observable } from './observable'
import { proxyToRaw, rawToProxy } from './internals'
import {
  registerRunningReactionForOperation,
  queueReactionsForOperation,
  hasRunningReaction
} from './reactionRunner'

const hasOwnProperty = Object.prototype.hasOwnProperty

// intercept get operations on observables to know which reaction uses their properties
function get (target, key, receiver) {
  const result = Reflect.get(target, key, receiver)
  // do not register (observable.prop -> reaction) pairs for these cases
  if (typeof key === 'symbol' || typeof result === 'function') {
    return result
  }
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target, key, type: 'get' })
  // if we are inside a reaction and observable.prop is an object wrap it in an observable too
  // this is needed to intercept property access on that object too (dynamic observable tree)
  if (hasRunningReaction() && typeof result === 'object' && result !== null) {
    return observable(result)
  }
  // otherwise return the observable wrapper if it is already created and cached or the raw object
  return rawToProxy.get(result) || result
}

function has (target, key) {
  const result = Reflect.has(target, key)
  // do not register (observable.prop -> reaction) pairs for these cases
  if (typeof key === 'symbol') {
    return result
  }
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target, key, type: 'has' })
  return result
}

function ownKeys (target) {
  registerRunningReactionForOperation({ target, type: 'iterate' })
  return Reflect.ownKeys(target)
}

// intercept set operations on observables to know when to trigger reactions
function set (target, key, value, receiver) {
  // make sure to do not pollute the raw object with observables
  if (typeof value === 'object' && value !== null) {
    value = proxyToRaw.get(value) || value
  }
  // save if the object had a descriptor for this key
  const hadKey = hasOwnProperty.call(target, key)
  // save if the value changed because of this set operation
  const valueChanged = value !== target[key]
  // execute the set operation before running any reaction
  const result = Reflect.set(target, key, value, receiver)
  // emit a warning and do not queue anything when another reaction is queued
  // from an already running reaction
  if (hasRunningReaction()) {
    console.error(
      `Mutating observables in reactions is forbidden. You set ${key} to ${value}.`
    )
    return result
  }
  // do not queue reactions if it is a symbol keyed property
  // or the target of the operation is not the raw receiver
  // (possible because of prototypal inheritance)
  if (typeof key === 'symbol' || target !== proxyToRaw.get(receiver)) {
    return result
  }

  // queue a reaction if it's a new property or its value changed
  if (!hadKey) {
    queueReactionsForOperation({ target, key, type: 'add' })
  } else if (valueChanged) {
    queueReactionsForOperation({ target, key, type: 'set' })
  }
  return result
}

function deleteProperty (target, key) {
  // save if the object had the key
  const hadKey = hasOwnProperty.call(target, key)
  // execute the delete operation before running any reaction
  const result = Reflect.deleteProperty(target, key)
  // only queue reactions for non symbol keyed property delete which resulted in an actual change
  if (typeof key !== 'symbol' && hadKey) {
    queueReactionsForOperation({ target, key, type: 'delete' })
  }
  return result
}

export default { get, has, ownKeys, set, deleteProperty }
