import {
  registerRunningReactionForKey,
  queueReactionsForKey
} from '../reactionRunner'
import { proxyToRaw } from '../internals'

const ITERATE = Symbol('iterate')
const getPrototypeOf = Object.getPrototypeOf

const instrumentations = {
  has (value) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey(rawContext, value)
    return proto.has.apply(rawContext, arguments)
  },
  get (key) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey(rawContext, key)
    return proto.get.apply(rawContext, arguments)
  },
  add (value) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    // forward the operation before queueing reactions
    const valueChanged = !proto.has.call(rawContext, value)
    const result = proto.add.apply(rawContext, arguments)
    if (valueChanged) {
      queueReactionsForKey(rawContext, value)
      queueReactionsForKey(rawContext, ITERATE)
    }
    return result
  },
  set (key, value) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    // forward the operation before queueing reactions
    const valueChanged = proto.get.call(rawContext, key) !== value
    const result = proto.set.apply(rawContext, arguments)
    if (valueChanged) {
      queueReactionsForKey(rawContext, key)
      queueReactionsForKey(rawContext, ITERATE)
    }
    return result
  },
  delete (value) {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    // forward the operation before queueing reactions
    const valueChanged = proto.has.call(rawContext, value)
    const result = proto.delete.apply(rawContext, arguments)
    if (valueChanged) {
      queueReactionsForKey(rawContext, value)
      queueReactionsForKey(rawContext, ITERATE)
    }
    return result
  },
  clear () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    // forward the operation before queueing reactions
    const valueChanged = rawContext.size !== 0
    const result = proto.clear.apply(rawContext, arguments)
    if (valueChanged) {
      queueReactionsForKey(rawContext, ITERATE)
    }
    return result
  },
  forEach () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey(rawContext, ITERATE)
    return proto.forEach.apply(rawContext, arguments)
  },
  keys () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey(rawContext, ITERATE)
    return proto.keys.apply(rawContext, arguments)
  },
  values () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey(rawContext, ITERATE)
    return proto.values.apply(rawContext, arguments)
  },
  entries () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey(rawContext, ITERATE)
    return proto.entries.apply(rawContext, arguments)
  },
  [Symbol.iterator] () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey(rawContext, ITERATE)
    return proto[Symbol.iterator].apply(rawContext, arguments)
  },
  get size () {
    const rawContext = proxyToRaw.get(this)
    const proto = getPrototypeOf(this)
    registerRunningReactionForKey(rawContext, ITERATE)
    return Reflect.get(proto, 'size', rawContext)
  }
}

export default {
  get (target, key, receiver) {
    // instrument methods and property accessors to be reactive
    target = (key in getPrototypeOf(target)) ? instrumentations : target
    return Reflect.get(target, key, receiver)
  }
}
