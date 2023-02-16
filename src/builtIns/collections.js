import { observable } from '../observable'
import {
  registerRunningReactionForOperation,
  queueReactionsForOperation,
  hasRunningReaction
} from '../reactionRunner'
import { proxyToRaw, rawToProxy, updateFnDefiniton } from '../internals'

const hasOwnProperty = Object.prototype.hasOwnProperty

function findObservable (obj, updateFn) {
  const observableObj = rawToProxy.get(obj)
  if (hasRunningReaction() && typeof obj === 'object' && obj !== null) {
    if (observableObj) {
      return observableObj
    }
    return observable(obj, updateFn)
  }
  return observableObj || obj
}

function patchIterator (iterator, isEntries, updateFn) {
  const originalNext = iterator.next
  iterator.next = () => {
    let { done, value } = originalNext.call(iterator)
    if (!done) {
      if (isEntries) {
        value[1] = findObservable(value[1], updateFn)
      } else {
        value = findObservable(value, updateFn)
      }
    }
    return { done, value }
  }
  return iterator
}

const instrumentations = {
  has (key) {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReactionForOperation({ target, key, type: 'has' })
    return proto.has.apply(target, arguments)
  },
  get (key) {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReactionForOperation({ target, key, type: 'get' })
    return findObservable(proto.get.apply(target, arguments), updateFnDefiniton.get(this))
  },
  add (key) {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    const hadKey = proto.has.call(target, key)
    // forward the operation before queueing reactions
    const result = proto.add.apply(target, arguments)
    if (!hadKey) {
      queueReactionsForOperation({ target, key, value: key, type: 'add' })
    }


    const updateFn = updateFnDefiniton.get(this);
    if (updateFn) {
      updateFn();
    }

    return result
  },
  set (key, value) {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    const hadKey = proto.has.call(target, key)
    const oldValue = proto.get.call(target, key)
    // forward the operation before queueing reactions
    const result = proto.set.apply(target, arguments)
    if (!hadKey) {
      queueReactionsForOperation({ target, key, value, type: 'add' })
    } else if (value !== oldValue) {
      queueReactionsForOperation({ target, key, value, oldValue, type: 'set' })
    }

    const updateFn = updateFnDefiniton.get(this);
    if (updateFn) {
      updateFn();

      if (proxyToRaw.get(value) && updateFnDefiniton.get(value) != updateFn) {
        console.warn('You moved a store into a different store with a global reaction. This is not supported. The global reactions WILL NOT be called for this store.\nTo avoid this, copy the object (e.g. json.parse(json.stringify(obj))')
      }
    }

    return result
  },
  delete (key) {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    const hadKey = proto.has.call(target, key)
    const oldValue = proto.get ? proto.get.call(target, key) : undefined
    // forward the operation before queueing reactions
    const result = proto.delete.apply(target, arguments)
    if (hadKey) {
      queueReactionsForOperation({ target, key, oldValue, type: 'delete' })
    }

    const updateFn = updateFnDefiniton.get(this);
    if (updateFn) {
      updateFn();
    }

    return result
  },
  clear () {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    const hadItems = target.size !== 0
    const oldTarget = target instanceof Map ? new Map(target) : new Set(target)
    // forward the operation before queueing reactions
    const result = proto.clear.apply(target, arguments)
    if (hadItems) {
      queueReactionsForOperation({ target, oldTarget, type: 'clear' })
    }

    const updateFn = updateFnDefiniton.get(this);
    if (updateFn) {
      updateFn();
    }

    return result
  },
  forEach (cb, ...args) {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    // swap out the raw values with their observable pairs
    // before passing them to the callback
    const wrappedCb = (value, ...rest) => cb(findObservable(value, updateFnDefiniton.get(this)), ...rest)
    return proto.forEach.call(target, wrappedCb, ...args)
  },
  keys () {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    return proto.keys.apply(target, arguments)
  },
  values () {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    const iterator = proto.values.apply(target, arguments)
    return patchIterator(iterator, false, updateFnDefiniton.get(this))
  },
  entries () {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    const iterator = proto.entries.apply(target, arguments)
    return patchIterator(iterator, true, updateFnDefiniton.get(this))
  },
  [Symbol.iterator] () {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    const iterator = proto[Symbol.iterator].apply(target, arguments)
    return patchIterator(iterator, target instanceof Map, updateFnDefiniton.get(this))
  },
  get size () {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    return Reflect.get(proto, 'size', target)
  }
}

export default {
  get (target, key, receiver) {
    // instrument methods and property accessors to be reactive
    target = hasOwnProperty.call(instrumentations, key)
      ? instrumentations
      : target
    return Reflect.get(target, key, receiver)
  }
}
