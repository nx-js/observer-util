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

const native = Map.prototype;
const ITERATE = Symbol('iterate map');
const getters = ['has', 'get'];
const iterators = ['forEach', 'keys', 'values', 'entries', Symbol.iterator];
const all = ['set', 'delete', 'clear'].concat(getters, iterators);

function shim (target, registerObserver, queueObservers) {
  target.$raw = {};

  for (let method of all) {
    target.$raw[method] = function () {
      return native[method].apply(target, arguments)
    };
  }

  Object.defineProperty(target.$raw, 'size', {
    get: () => Reflect.get(native, 'size', target)
  });

  Object.defineProperty(target, 'size', {
    get: function () {
      registerObserver(target, ITERATE);
      return Reflect.get(native, 'size', target)
    }
  });

  for (let getter of getters) {
    target[getter] = function (key) {
      registerObserver(this, key);
      return native[getter].apply(this, arguments)
    };
  }

  for (let iterator of iterators) {
    target[iterator] = function () {
      registerObserver(this, ITERATE);
      return native[iterator].apply(this, arguments)
    };
  }

  target.set = function (key, value) {
    if (this.get(key) !== value) {
      queueObservers(this, key);
      queueObservers(this, ITERATE);
    }
    return native.set.apply(this, arguments)
  };

  target.delete = function (key) {
    if (this.has(key)) {
      queueObservers(this, key);
      queueObservers(this, ITERATE);
    }
    return native.delete.apply(this, arguments)
  };

  target.clear = function () {
    if (this.size) {
      queueObservers(this, ITERATE);
    }
    return native.clear.apply(this, arguments)
  };

  return target
}

const native$1 = Set.prototype;
const ITERATE$1 = Symbol('iterate set');
const getters$1 = ['has'];
const iterators$1 = ['forEach', 'keys', 'values', 'entries', Symbol.iterator];
const all$1 = ['add', 'delete', 'clear'].concat(getters$1, iterators$1);

function shim$1 (target, registerObserver, queueObservers) {
  target.$raw = {};

  for (let method of all$1) {
    target.$raw[method] = function () {
      return native$1[method].apply(target, arguments)
    };
  }

  Object.defineProperty(target.$raw, 'size', {
    get: () => Reflect.get(native$1, 'size', target)
  });

  Object.defineProperty(target, 'size', {
    get: function () {
      registerObserver(target, ITERATE$1);
      return Reflect.get(native$1, 'size', target)
    }
  });

  for (let getter of getters$1) {
    target[getter] = function (value) {
      registerObserver(this, value);
      return native$1[getter].apply(this, arguments)
    };
  }

  for (let iterator of iterators$1) {
    target[iterator] = function () {
      registerObserver(this, ITERATE$1);
      return native$1[iterator].apply(this, arguments)
    };
  }

  target.add = function (value) {
    if (!this.has(value)) {
      queueObservers(this, value);
      queueObservers(this, ITERATE$1);
    }
    return native$1.add.apply(this, arguments)
  };

  target.delete = function (value) {
    if (this.has(value)) {
      queueObservers(this, value);
      queueObservers(this, ITERATE$1);
    }
    return native$1.delete.apply(this, arguments)
  };

  target.clear = function () {
    if (this.size) {
      queueObservers(this, ITERATE$1);
    }
    return native$1.clear.apply(this, arguments)
  };

  return target
}

const native$2 = WeakMap.prototype;
const getters$2 = ['has', 'get'];
const all$2 = ['set', 'delete'].concat(getters$2);

function shim$2 (target, registerObserver, queueObservers) {
  target.$raw = {};

  for (let method of all$2) {
    target.$raw[method] = function () {
      return native$2[method].apply(target, arguments)
    };
  }

  for (let getter of getters$2) {
    target[getter] = function (key) {
      registerObserver(this, key);
      return native$2[getter].apply(this, arguments)
    };
  }

  target.set = function (key, value) {
    if (this.get(key) !== value) {
      queueObservers(this, key);
    }
    return native$2.set.apply(this, arguments)
  };

  target.delete = function (key) {
    if (this.has(key)) {
      queueObservers(this, key);
    }
    return native$2.delete.apply(this, arguments)
  };

  return target
}

const native$3 = WeakSet.prototype;
const getters$3 = ['has'];
const all$3 = ['add', 'delete'].concat(getters$3);

function shim$3 (target, registerObserver, queueObservers) {
  target.$raw = {};

  for (let method of all$3) {
    target.$raw[method] = function () {
      return native$3[method].apply(target, arguments)
    };
  }

  for (let getter of getters$3) {
    target[getter] = function (value) {
      registerObserver(this, value);
      return native$3[getter].apply(this, arguments)
    };
  }

  target.add = function (value) {
    if (!this.has(value)) {
      queueObservers(this, value);
    }
    return native$3.add.apply(this, arguments)
  };

  target.delete = function (value) {
    if (this.has(value)) {
      queueObservers(this, value);
    }
    return native$3.delete.apply(this, arguments)
  };

  return target
}

var builtIns = new Map([
  [Map.prototype, shim],
  [Set.prototype, shim$1],
  [WeakMap.prototype, shim$2],
  [WeakSet.prototype, shim$3],
  [Date.prototype, true],
  [RegExp.prototype, true]
]);

const observerStore = new WeakMap();

function storeObservable (target) {
  observerStore.set(target, Object.create(null));
}

function storeObserver (target, key, observer) {
  const observers = observerStore.get(target);
  const observersForKey = observers[key];
  if (observersForKey !== observer) {
    if (!observersForKey) {
      observers[key] = observer;
    } else if (observersForKey instanceof Set) {
      observersForKey.add(observer);
    } else {
      observers[key] = new Set().add(observersForKey).add(observer);
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

const UNOBSERVED = Symbol('unobserved');
const ENUMERATE = Symbol('enumerate');
const queuedObservers = new Set();
const proxyToRaw = new WeakMap();
const rawToProxy = new WeakMap();
let queued = false;
let currentObserver;
const handlers = {get, ownKeys, set, deleteProperty};

function observe (observer) {
  if (typeof observer !== 'function') {
    throw new TypeError('Observer must be a function.')
  }
  runObserver(observer);
  return observer
}

function unobserve (observer) {
  queuedObservers.delete(observer);
  observer[UNOBSERVED] = true;
  // needs cleanup later this way! observer arguments and context can't be wiped
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
  return rawToProxy.get(obj) || toObservable(obj)
}

function toObservable (obj) {
  const observable = createObservable(obj);
  storeObservable(obj);
  proxyToRaw.set(observable, obj);
  rawToProxy.set(obj, observable);
  return observable
}

function createObservable (obj) {
  const builtIn = builtIns.get(Object.getPrototypeOf(obj));
  if (!builtIn) {
    return new Proxy(obj, handlers)
  }
  if (typeof builtIn === 'function') {
    return builtIn(obj, registerObserver, queueObservers)
  }
  return obj
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
  const oldValue = Reflect.get(target, key, receiver);
  if (key === 'length' || value !== oldValue) {
    queueObservers(target, key);
    queueObservers(target, ENUMERATE);
  }
  return Reflect.set(target, key, value, receiver)
}

function deleteProperty (target, key) {
  if (typeof key !== 'symbol' && Reflect.has(target, key)) {
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

exports.observe = observe;
exports.unobserve = unobserve;
exports.unqueue = unqueue;
exports.exec = exec;
exports.isObservable = isObservable;
exports.observable = observable;
