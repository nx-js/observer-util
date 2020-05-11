import { observable, observableChild } from './observable'
import { proxyToRaw } from './internals'
import {
  registerRunningReactionForOperation,
  queueReactionsForOperation
} from './reactionRunner'
import { runProxyHandler } from './customHandlers'

const hasOwnProperty = Object.prototype.hasOwnProperty
const wellKnownSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map((key) => Symbol[key])
    .filter((value) => typeof value === 'symbol')
)

// intercept get operations on observables to know which reaction uses their properties
function get (target, key, receiver) {
  const result = runProxyHandler('get', target, key, receiver)
  // do not register (observable.prop -> reaction) pairs for well known symbols
  // these symbols are frequently retrieved in low level JavaScript under the hood
  if (typeof key === 'symbol' && wellKnownSymbols.has(key)) {
    return result
  }
  // register and save the (observable.prop -> runningReaction) relation
  registerRunningReactionForOperation({ target, key, receiver, type: 'get' })

  // do not violate the none-configurable none-writable prop get handler invariant
  // fall back to none reactive mode in this case, instead of letting the Proxy throw a TypeError
  const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
  if (
    descriptor &&
    descriptor.writable === false &&
    descriptor.configurable === false
  ) {
    return result
  }

  // otherwise return the observable wrapper if it is already created and cached or the raw object
  return observableChild(result, target)
}

function has (target, key) {
  const result = runProxyHandler('has', target, key)
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target, key, type: 'has' })
  return result
}

function ownKeys (target) {
  registerRunningReactionForOperation({ target, type: 'iterate' })
  return runProxyHandler('ownKeys', target)
}

// intercept set operations on observables to know when to trigger reactions
function set (target, key, value, receiver) {
  // make sure to do not pollute the raw object with observables
  value = proxyToRaw.get(value) || value
  // save if the object had a descriptor for this key
  const hadKey = hasOwnProperty.call(target, key)
  // save if the value changed because of this set operation
  const oldValue = target[key]
  // execute the set operation before running any reaction
  const result = runProxyHandler('set', target, key, value, receiver)
  // do not queue reactions if the target of the operation is not the raw receiver
  // this possible because of prototypal inheritance
  // when the prototype has a setter the set operation traverses the whole prototype chain
  // and calls the set trap on every object until it finds the setter
  // this is undesired, it is enough for us to trigger the reactions in the set trap of
  // the receiver (child) object to avoid duplicate reactions
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
  const result = runProxyHandler('deleteProperty', target, key)
  // only queue reactions for delete operations which resulted in an actual change
  if (hadKey) {
    queueReactionsForOperation({ target, key, oldValue, type: 'delete' })
  }
  return result
}

// return an observable object instance when an observable class is instantiated
function construct (target, args, newTarget) {
  return observable(runProxyHandler('construct', target, args, newTarget))
}

export default { get, has, ownKeys, set, deleteProperty, construct }
