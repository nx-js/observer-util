import { observable } from "./observable";
import { proxyToRaw, rawToProxy, rawToHandlers } from "./internals";
import {
  registerRunningReactionForOperation,
  queueReactionsForOperation,
  hasRunningReaction
} from "./reactionRunner";

const hasOwnProperty = Object.prototype.hasOwnProperty;
const wellKnownSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => Symbol[key])
    .filter(value => typeof value === "symbol")
);

function getHandlers(target) {
  return rawToHandlers.get(target) || Reflect;
}

// intercept get operations on observables to know which reaction uses their properties
function get(target, key, receiver) {
  const handlers = getHandlers(target);
  const result = handlers.get(target, key, receiver);
  // do not register (observable.prop -> reaction) pairs for well known symbols
  // these symbols are frequently retrieved in low level JavaScript under the hood
  if (typeof key === "symbol" && wellKnownSymbols.has(key)) {
    return result;
  }
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target, key, receiver, type: "get" });

  const observableResult = rawToProxy.get(result);

  // if we are inside a reaction and observable.prop is an object, wrap it in an observable too
  // this is needed to intercept property access on that object too (dynamic observable tree)
  // always wrap when there are custom handlers (even when there is no running reaction)
  // custom handlers might do things outside of reactions so they need this
  if (
    (hasRunningReaction() || handlers !== Reflect) &&
    typeof result === "object" &&
    result !== null
  ) {
    if (observableResult) {
      return observableResult;
    }
    // do not violate the none-configurable none-writable prop get handler invariant
    // fall back to none reactive mode in this case, instead of letting the Proxy throw a TypeError
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (
      !descriptor ||
      !(descriptor.writable === false && descriptor.configurable === false)
    ) {
      // pass the parent's custom handlers to the child object
      // this creates a 'deep proxy' which shares handlers deeply with its object children
      return observable(result, handlers);
    }
  }
  // otherwise return the observable wrapper if it is already created and cached or the raw object
  return observableResult || result;
}

function has(target, key) {
  const result = getHandlers(target).has(target, key);
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target, key, type: "has" });
  return result;
}

function ownKeys(target) {
  registerRunningReactionForOperation({ target, type: "iterate" });
  return getHandlers(target).ownKeys(target);
}

// intercept set operations on observables to know when to trigger reactions
function set(target, key, value, receiver) {
  // make sure to do not pollute the raw object with observables
  if (typeof value === "object" && value !== null) {
    value = proxyToRaw.get(value) || value;
  }
  // save if the object had a descriptor for this key
  const hadKey = hasOwnProperty.call(target, key);
  // save if the value changed because of this set operation
  const oldValue = target[key];
  // execute the set operation before running any reaction
  const result = getHandlers(target).set(target, key, value, receiver);
  // do not queue reactions if the target of the operation is not the raw receiver
  // (possible because of prototypal inheritance)
  if (target !== proxyToRaw.get(receiver)) {
    return result;
  }
  // queue a reaction if it's a new property or its value changed
  if (!hadKey) {
    queueReactionsForOperation({ target, key, value, receiver, type: "add" });
  } else if (value !== oldValue) {
    queueReactionsForOperation({
      target,
      key,
      value,
      oldValue,
      receiver,
      type: "set"
    });
  }
  return result;
}

function deleteProperty(target, key) {
  // save if the object had the key
  const hadKey = hasOwnProperty.call(target, key);
  const oldValue = target[key];
  // execute the delete operation before running any reaction
  const result = getHandlers(target).deleteProperty(target, key);
  // only queue reactions for delete operations which resulted in an actual change
  if (hadKey) {
    queueReactionsForOperation({ target, key, oldValue, type: "delete" });
  }
  return result;
}

export default { get, has, ownKeys, set, deleteProperty };
