import { observable } from './observable'
import { proxyToRaw, rawToProxy, updateFnDefiniton } from './internals'
import {
  registerRunningReactionForOperation,
  queueReactionsForOperation,
  hasRunningReaction
} from './reactionRunner'

const hasOwnProperty = Object.prototype.hasOwnProperty
const wellKnownSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => Symbol[key])
    .filter(value => typeof value === 'symbol')
)

// intercept get operations on observables to know which reaction uses their properties
function get (target, key, receiver) {
  const result = Reflect.get(target, key, receiver)

  // do not register (observable.prop -> reaction) pairs for well known symbols
  // these symbols are frequently retrieved in low level JavaScript under the hood
  if (typeof key === 'symbol' && wellKnownSymbols.has(key)) {
    return result
  }
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target, key, receiver, type: 'get' })
  // if we are inside a reaction and observable.prop is an object wrap it in an observable too
  // this is needed to intercept property access on that object too (dynamic observable tree)
  const observableResult = rawToProxy.get(result)
  const updateFn = updateFnDefiniton.get(receiver);
  if ((hasRunningReaction() || updateFn) && typeof result === 'object' && result !== null) {
    if (observableResult) {
      return observableResult
    }
    // do not violate the none-configurable none-writable prop get handler invariant
    // fall back to none reactive mode in this case, instead of letting the Proxy throw a TypeError
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
    if (
      !descriptor ||
      !(descriptor.writable === false && descriptor.configurable === false)
    ) {
      return observable(result, updateFn)
    }
  }
  // otherwise return the observable wrapper if it is already created and cached or the raw object
  return observableResult || result
}

function has (target, key) {
  const result = Reflect.has(target, key)
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
  const updateFn = updateFnDefiniton.get(receiver)

  // make sure to do not pollute the raw object with observables
  if (typeof value === 'object' && value !== null) {
    const rawVal = proxyToRaw.get(value);

    if (rawVal) {
      if (updateFn && updateFnDefiniton.get(value) != updateFn) {
        console.warn('You moved a store into a store with a global reaction. This is not supported. The global reactions WILL NOT be called for this store.\nTo avoid this, copy the object (e.g. json.parse(json.stringify(obj))')
      }

      value = rawVal
    }

  }
  // save if the object had a descriptor for this key
  const hadKey = hasOwnProperty.call(target, key)
  // save if the value changed because of this set operation
  const oldValue = target[key]
  // execute the set operation before running any reaction
  const result = Reflect.set(target, key, value, receiver)



  // execute global store update
  if (updateFn) {
    updateFn();
  }


  // do not queue reactions if the target of the operation is not the raw receiver
  // (possible because of prototypal inheritance)
  if (target !== proxyToRaw.get(receiver)) {
    return result
  }
  // queue a reaction if it's a new property or its value changed
  if (!hadKey) {
    queueReactionsForOperation({ target, key, value, receiver, type: 'add' })
  } else if (value !== oldValue) {
    queueReactionsForOperation({
      target,
      key,
      value,
      oldValue,
      receiver,
      type: 'set'
    })
  }
  return result
}

function deleteProperty (target, key) {
  // save if the object had the key
  const hadKey = hasOwnProperty.call(target, key)
  const oldValue = target[key]
  // execute the delete operation before running any reaction
  const result = Reflect.deleteProperty(target, key)
  // only queue reactions for delete operations which resulted in an actual change
  if (hadKey) {
    queueReactionsForOperation({ target, key, oldValue, type: 'delete' })
  }

  const updateFn = updateFnDefiniton.get(rawToProxy.get(target));
  if (updateFn) {
    updateFn();
  }

  return result
}

export default { get, has, ownKeys, set, deleteProperty }
