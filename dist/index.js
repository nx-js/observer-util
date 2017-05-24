'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const promise = Promise.resolve();
let mutateWithTask;
let currTask;

function nextTick (task) {
  currTask = task;
  if (mutateWithTask) {
    mutateWithTask();
  } else {
    promise.then(task);
  }
}

if (typeof MutationObserver !== 'undefined') {
  let counter = 0;
  const observer = new MutationObserver(onTask);
  const textNode = document.createTextNode(String(counter));
  observer.observe(textNode, {characterData: true});

  mutateWithTask = function mutateWithTask () {
    counter = (counter + 1) % 2;
    textNode.textContent = counter;
  };
}

function onTask () {
  if (currTask) {
    currTask();
  }
}

const UNOBSERVED = Symbol('unobserved');
const proxyToRaw = new WeakMap();
const rawToProxy = new WeakMap();

const ITERATE = Symbol('iterate');
const getPrototypeOf = Object.getPrototypeOf;

function has (value) {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.has.apply(this, arguments)
  }
  registerObserver(rawContext, value);
  return proto.has.apply(rawContext, arguments)
}

function get$1 (value) {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.get.apply(this, arguments)
  }
  registerObserver(rawContext, value);
  return proto.get.apply(rawContext, arguments)
}

function add (value) {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.add.apply(this, arguments)
  }
  if (!proto.has.call(rawContext, value)) {
    queueObservers(rawContext, value);
    queueObservers(rawContext, ITERATE);
  }
  return proto.add.apply(rawContext, arguments)
}

function set$1 (key, value) {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.set.apply(this, arguments)
  }
  if (proto.get.call(rawContext, key) !== value) {
    queueObservers(rawContext, key);
    queueObservers(rawContext, ITERATE);
  }
  return proto.set.apply(rawContext, arguments)
}

function deleteFn (value) {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.delete.apply(this, arguments)
  }
  if (proto.has.call(rawContext, value)) {
    queueObservers(rawContext, value);
    queueObservers(rawContext, ITERATE);
  }
  return proto.delete.apply(rawContext, arguments)
}

function clear () {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.clear.apply(this, arguments)
  }
  if (rawContext.size) {
    queueObservers(rawContext, ITERATE);
  }
  return proto.clear.apply(rawContext, arguments)
}

function forEach () {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.forEach.apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE);
  return proto.forEach.apply(rawContext, arguments)
}

function keys () {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.keys.apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE);
  return proto.keys.apply(rawContext, arguments)
}

function values () {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.values.apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE);
  return proto.values.apply(rawContext, arguments)
}

function entries () {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto.entries.apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE);
  return proto.entries.apply(rawContext, arguments)
}

function iterator () {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return proto[Symbol.iterator].apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE);
  return proto[Symbol.iterator].apply(rawContext, arguments)
}

function getSize () {
  const rawContext = proxyToRaw.get(this);
  const proto = getPrototypeOf(this);
  if (!rawContext) {
    return Reflect.get(proto, 'size', this)
  }
  registerObserver(rawContext, ITERATE);
  return Reflect.get(proto, 'size', rawContext)
}

function instrumentMap (target) {
  target.has = has;
  target.get = get$1;
  target.set = set$1;
  target.delete = deleteFn;
  target.clear = clear;
  target.forEach = forEach;
  target.keys = keys;
  target.values = values;
  target.entries = entries;
  target[Symbol.iterator] = iterator;
  Object.defineProperty(target, 'size', { get: getSize });
}

function instrumentSet (target) {
  target.has = has;
  target.add = add;
  target.delete = deleteFn;
  target.clear = clear;
  target.forEach = forEach;
  target.keys = keys;
  target.values = values;
  target.entries = entries;
  target[Symbol.iterator] = iterator;
  Object.defineProperty(target, 'size', { get: getSize });
}

function instrumentWeakMap (target) {
  target.has = has;
  target.get = get$1;
  target.set = set$1;
  target.delete = deleteFn;
}

function instrumentWeakSet (target) {
  target.has = has;
  target.add = add;
  target.delete = deleteFn;
}

var instrumentations = new Map([
  [Map.prototype, instrumentMap],
  [Set.prototype, instrumentSet],
  [WeakMap.prototype, instrumentWeakMap],
  [WeakSet.prototype, instrumentWeakSet],
  [Date.prototype, false],
  [RegExp.prototype, false]
]);

const observerStore = new WeakMap();

function storeObservable (target) {
  observerStore.set(target, Object.create(null));
}

function storeObserver (target, key, observer) {
  const observers = observerStore.get(target);
  const observersForKey = observers[key];
  if (observersForKey !== observer) {
    if (typeof observersForKey === 'object' && observersForKey.size > 0) {
      observersForKey.add(observer);
      observer[`_${key}_observers`] = observersForKey;
    } else if (typeof observersForKey === 'function' && !observersForKey[UNOBSERVED]) {
      observers[key] = new Set().add(observer).add(observersForKey);
    } else {
      observers[key] = observer;
    }
  }
}

function iterateObservers (target, key, fn) {
  const observers = observerStore.get(target);
  const observersForKey = observers[key];
  if (observersForKey instanceof Set) {
    observersForKey.forEach(fn);
  } else if (observersForKey) {
    fn(observersForKey);
  }
}

function releaseObserver (observer) {
  for (let key in observer) {
    observer[key].delete(observer);
  }
}

const ENUMERATE = Symbol('enumerate');
const queuedObservers = new Set();
let queued = false;
let currentObserver;
const handlers = { get, ownKeys, set, deleteProperty };

function observe (observer) {
  if (typeof observer !== 'function') {
    throw new TypeError('Observer must be a function.')
  }
  observer[UNOBSERVED] = false;
  runObserver(observer);
  return observer
}

function unobserve (observer) {
  queuedObservers.delete(observer);
  observer[UNOBSERVED] = true;
  releaseObserver(observer);
}

function unqueue (observer) {
  queuedObservers.delete(observer);
}

function exec (observer) {
  runObserver(observer);
}

function isObservable (obj) {
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object')
  }
  return proxyToRaw.has(obj)
}

function observable (obj) {
  obj = obj || {};
  if (typeof obj !== 'object') {
    throw new TypeError('first argument must be an object or undefined')
  }
  if (proxyToRaw.has(obj)) {
    return obj
  }
  return rawToProxy.get(obj) || instrumentObservable(obj) || createObservable(obj)
}

function instrumentObservable (obj) {
  const instrument = instrumentations.get(Object.getPrototypeOf(obj));
  if (typeof instrument === 'function') {
    instrument(obj);
  }
  if (instrument === false) {
    return obj
  }
}

function createObservable (obj) {
  const observable = new Proxy(obj, handlers);
  storeObservable(obj);
  proxyToRaw.set(observable, obj);
  rawToProxy.set(obj, observable);
  return observable
}

function get (target, key, receiver) {
  const rawTarget = proxyToRaw.get(target) || target;
  if (key === '$raw') {
    return rawTarget
  }
  const result = Reflect.get(target, key, receiver);
  if (typeof key === 'symbol' || typeof result === 'function') {
    return result
  }
  registerObserver(rawTarget, key);
  if (currentObserver && typeof result === 'object' && result !== null) {
    return observable(result)
  }
  return rawToProxy.get(result) || result
}

function registerObserver (target, key) {
  if (currentObserver) {
    storeObserver(target, key, currentObserver);
  }
}

function ownKeys (target) {
  registerObserver(target, ENUMERATE);
  return Reflect.ownKeys(target)
}

function set (target, key, value, receiver) {
  if (typeof value === 'object' && value !== null) {
    value = proxyToRaw.get(value) || value;
  }
  if (typeof key === 'symbol' || target !== proxyToRaw.get(receiver)) {
    return Reflect.set(target, key, value, receiver)
  }
  if (key === 'length' || value !== target[key]) {
    queueObservers(target, key);
    queueObservers(target, ENUMERATE);
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  if (typeof key !== 'symbol' && (key in target)) {
    queueObservers(target, key);
    queueObservers(target, ENUMERATE);
  }
  return Reflect.deleteProperty(target, key)
}

function queueObservers (target, key) {
  if (!queued) {
    nextTick(runObservers);
    queued = true;
  }
  iterateObservers(target, key, queueObserver);
}

function queueObserver (observer) {
  if (!observer[UNOBSERVED]) {
    queuedObservers.add(observer);
  }
}

function runObservers () {
  queuedObservers.forEach(runObserver);
  queuedObservers.clear();
  queued = false;
}

function runObserver (observer) {
  try {
    currentObserver = observer;
    observer();
  } finally {
    currentObserver = undefined;
  }
}

exports.observable = observable;
exports.isObservable = isObservable;
exports.observe = observe;
exports.unobserve = unobserve;
exports.unqueue = unqueue;
exports.exec = exec;
