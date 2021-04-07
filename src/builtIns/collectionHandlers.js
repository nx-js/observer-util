import { observableChild } from '../observable'
import {
  registerRunningReactionForOperation,
  queueReactionsForOperation
} from '../reactionRunner'
import { proxyToRaw } from '../internals'
import { runCollectionHandler } from '../customHandlers'

function patchIterator (iterator, target, isEntries) {
  const originalNext = iterator.next
  iterator.next = () => {
    let { done, value } = originalNext.call(iterator)
    if (!done) {
      if (isEntries) {
        value[1] = observableChild(value[1], target)
      } else {
        value = observableChild(value, target)
      }
    }
    return { done, value }
  }
  return iterator
}

export const collectionHandlers = {
  has (key) {
    const target = proxyToRaw.get(this)
    registerRunningReactionForOperation({ target, key, type: 'has' })
    return runCollectionHandler('has', target, ...arguments)
  },
  get (key) {
    const target = proxyToRaw.get(this)
    registerRunningReactionForOperation({ target, key, type: 'get' })
    return observableChild(
      runCollectionHandler('get', target, ...arguments),
      target
    )
  },
  add (key) {
    const target = proxyToRaw.get(this)
    const hadKey = target.has(key)
    // forward the operation before queueing reactions
    const result = runCollectionHandler('add', target, ...arguments)
    if (!hadKey) {
      queueReactionsForOperation({ target, key, value: key, type: 'add' })
    }
    return result
  },
  set (key, value) {
    const target = proxyToRaw.get(this)
    const hadKey = target.has(key)
    const oldValue = target.get(key)
    // forward the operation before queueing reactions
    const result = runCollectionHandler('set', target, ...arguments)
    if (!hadKey) {
      queueReactionsForOperation({ target, key, value, type: 'add' })
    } else if (value !== oldValue) {
      queueReactionsForOperation({ target, key, value, oldValue, type: 'set' })
    }
    return result
  },
  delete (key) {
    const target = proxyToRaw.get(this)
    const hadKey = target.has(key)
    const oldValue = target.get ? target.get(key) : undefined
    // forward the operation before queueing reactions
    const result = runCollectionHandler('delete', target, ...arguments)
    if (hadKey) {
      queueReactionsForOperation({ target, key, oldValue, type: 'delete' })
    }
    return result
  },
  clear () {
    const target = proxyToRaw.get(this)
    const hadItems = target.size !== 0
    const oldTarget = target instanceof Map ? new Map(target) : new Set(target)
    // forward the operation before queueing reactions
    const result = runCollectionHandler('clear', target, ...arguments)
    if (hadItems) {
      queueReactionsForOperation({ target, oldTarget, type: 'clear' })
    }
    return result
  },
  forEach (callback, ...args) {
    const target = proxyToRaw.get(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    // swap out the raw values with their observable pairs
    // before passing them to the callback
    const wrappedCallback = (value, ...rest) =>
      callback(observableChild(value, target), ...rest)
    return runCollectionHandler('forEach', target, wrappedCallback, ...args)
  },
  keys () {
    const target = proxyToRaw.get(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    // TODO: no need to patch this?
    return runCollectionHandler('keys', target, ...arguments)
  },
  values () {
    const target = proxyToRaw.get(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    const iterator = runCollectionHandler('values', target, ...arguments)
    return patchIterator(iterator, target, false)
  },
  entries () {
    const target = proxyToRaw.get(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    const iterator = runCollectionHandler('entries', target, ...arguments)
    return patchIterator(iterator, target, true)
  },
  [Symbol.iterator] () {
    const target = proxyToRaw.get(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    const iterator = runCollectionHandler(
      Symbol.iterator,
      target,
      ...arguments
    )
    return patchIterator(iterator, target, target instanceof Map)
  },
  get size () {
    const target = proxyToRaw.get(this)
    registerRunningReactionForOperation({ target, type: 'iterate' })
    return runCollectionHandler('size', target)
  }
}

export default {
  get (target, key, receiver) {
    // instrument methods and property accessors to be reactive
    // eslint-disable-next-line no-prototype-builtins
    target = collectionHandlers.hasOwnProperty(key)
      ? collectionHandlers
      : target
    return Reflect.get(target, key, receiver)
  }
}
