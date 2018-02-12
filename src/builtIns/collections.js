import {
  registerRunningReactionForKey,
  queueReactionsForKey
} from '../reactionRunner'
import { proxyToRaw } from '../internals'

const getPrototypeOf = Object.getPrototypeOf
const hasOwnProperty = Object.prototype.hasOwnProperty

const instrumentations = {
  has (key) {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ target, key, type: 'has' })
    return proto.has.apply(target, arguments)
  },
  get (key) {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ target, key, type: 'get' })
    return proto.get.apply(target, arguments)
  },
  add (key) {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    const hadKey = proto.has.call(target, key)
    // forward the operation before queueing reactions
    const result = proto.add.apply(target, arguments)
    if (!hadKey) {
      queueReactionsForKey({ target, key, type: 'add' })
    }
    return result
  },
  set (key, value) {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    const hadKey = proto.has.call(target, key)
    const valueChanged = proto.get.call(target, key) !== value
    // forward the operation before queueing reactions
    const result = proto.set.apply(target, arguments)
    if (!hadKey) {
      queueReactionsForKey({ target, key, type: 'add' })
    } else if (valueChanged) {
      queueReactionsForKey({ target, key, type: 'set' })
    }
    return result
  },
  delete (key) {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    const hadKey = proto.has.call(target, key)
    // forward the operation before queueing reactions
    const result = proto.delete.apply(target, arguments)
    if (hadKey) {
      queueReactionsForKey({ target, key, type: 'delete' })
    }
    return result
  },
  clear () {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    const hadItems = target.size !== 0
    // forward the operation before queueing reactions
    const result = proto.clear.apply(target, arguments)
    if (hadItems) {
      queueReactionsForKey({ target, type: 'clear' })
    }
    return result
  },
  forEach () {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ target, type: 'iterate' })
    return proto.forEach.apply(target, arguments)
  },
  keys () {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ target, type: 'iterate' })
    return proto.keys.apply(target, arguments)
  },
  values () {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ target, type: 'iterate' })
    return proto.values.apply(target, arguments)
  },
  entries () {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ target, type: 'iterate' })
    return proto.entries.apply(target, arguments)
  },
  [Symbol.iterator] () {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ target, type: 'iterate' })
    return proto[Symbol.iterator].apply(target, arguments)
  },
  get size () {
    const target = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ target, type: 'iterate' })
    return Reflect.get(proto, 'size', target)
  }
}

export default {
  get (target, key, receiver) {
    // instrument methods and property accessors to be reactive
    target = hasOwnProperty.call(instrumentations, key) ? instrumentations : target
    return Reflect.get(target, key, receiver)
  }
}
