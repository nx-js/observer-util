import {
  registerRunningReactionForKey,
  queueReactionsForKey
} from '../reactionRunner'
import { proxyToRaw } from '../internals'

const getPrototypeOf = Object.getPrototypeOf
const hasOwnProperty = Object.prototype.hasOwnProperty

const instrumentations = {
  has (value) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ object: rawContext, key: value, type: 'has' })
    return proto.has.apply(rawContext, arguments)
  },
  get (key) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ object: rawContext, key, type: 'get' })
    return proto.get.apply(rawContext, arguments)
  },
  add (value) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    const hadKey = proto.has.call(rawContext, value)
    // forward the operation before queueing reactions
    const result = proto.add.apply(rawContext, arguments)
    if (!hadKey) {
      queueReactionsForKey({ object: rawContext, key: value, type: 'add' })
    }
    return result
  },
  set (key, value) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    const hadKey = proto.has.call(rawContext, key)
    const valueChanged = proto.get.call(rawContext, key) !== value
    // forward the operation before queueing reactions
    const result = proto.set.apply(rawContext, arguments)
    if (!hadKey) {
      queueReactionsForKey({ object: rawContext, key, type: 'add' })
    } else if (valueChanged) {
      queueReactionsForKey({ object: rawContext, key, type: 'set' })
    }
    return result
  },
  delete (value) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    const hadKey = proto.has.call(rawContext, value)
    // forward the operation before queueing reactions
    const result = proto.delete.apply(rawContext, arguments)
    if (hadKey) {
      queueReactionsForKey({ object: rawContext, key: value, type: 'delete' })
    }
    return result
  },
  clear () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    const hadItems = rawContext.size !== 0
    // forward the operation before queueing reactions
    const result = proto.clear.apply(rawContext, arguments)
    if (hadItems) {
      queueReactionsForKey({ object: rawContext, type: 'clear' })
    }
    return result
  },
  forEach () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ object: rawContext, type: 'iterate' })
    return proto.forEach.apply(rawContext, arguments)
  },
  keys () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ object: rawContext, type: 'iterate' })
    return proto.keys.apply(rawContext, arguments)
  },
  values () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ object: rawContext, type: 'iterate' })
    return proto.values.apply(rawContext, arguments)
  },
  entries () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ object: rawContext, type: 'iterate' })
    return proto.entries.apply(rawContext, arguments)
  },
  [Symbol.iterator] () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ object: rawContext, type: 'iterate' })
    return proto[Symbol.iterator].apply(rawContext, arguments)
  },
  get size () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey({ object: rawContext, type: 'iterate' })
    return Reflect.get(proto, 'size', rawContext)
  }
}

export default {
  get (target, key, receiver) {
    // instrument methods and property accessors to be reactive
    target = hasOwnProperty.call(instrumentations, key) ? instrumentations : target
    return Reflect.get(target, key, receiver)
  }
}
