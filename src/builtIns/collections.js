import { registerObserver, queueObservers } from '../observer'
import { proxyToRaw } from '../internals'

const ITERATE = Symbol('iterate')
const getPrototypeOf = Object.getPrototypeOf

export function has (value) {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.has.apply(this, arguments)
  }
  registerObserver(rawContext, value)
  return proto.has.apply(rawContext, arguments)
}

export function get (value) {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.get.apply(this, arguments)
  }
  registerObserver(rawContext, value)
  return proto.get.apply(rawContext, arguments)
}

export function add (value) {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.add.apply(this, arguments)
  }
  if (!proto.has.call(rawContext, value)) {
    queueObservers(rawContext, value)
    queueObservers(rawContext, ITERATE)
  }
  return proto.add.apply(rawContext, arguments)
}

export function set (key, value) {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.set.apply(this, arguments)
  }
  if (proto.get.call(rawContext, key) !== value) {
    queueObservers(rawContext, key)
    queueObservers(rawContext, ITERATE)
  }
  return proto.set.apply(rawContext, arguments)
}

export function deleteFn (value) {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.delete.apply(this, arguments)
  }
  if (proto.has.call(rawContext, value)) {
    queueObservers(rawContext, value)
    queueObservers(rawContext, ITERATE)
  }
  return proto.delete.apply(rawContext, arguments)
}

export function clear () {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.clear.apply(this, arguments)
  }
  if (rawContext.size) {
    queueObservers(rawContext, ITERATE)
  }
  return proto.clear.apply(rawContext, arguments)
}

export function forEach () {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.forEach.apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE)
  return proto.forEach.apply(rawContext, arguments)
}

export function keys () {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.keys.apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE)
  return proto.keys.apply(rawContext, arguments)
}

export function values () {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.values.apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE)
  return proto.values.apply(rawContext, arguments)
}

export function entries () {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto.entries.apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE)
  return proto.entries.apply(rawContext, arguments)
}

export function iterator () {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return proto[Symbol.iterator].apply(this, arguments)
  }
  registerObserver(rawContext, ITERATE)
  return proto[Symbol.iterator].apply(rawContext, arguments)
}

export function getSize () {
  const rawContext = proxyToRaw.get(this)
  const proto = getPrototypeOf(this)
  if (!rawContext) {
    return Reflect.get(proto, 'size', this)
  }
  registerObserver(rawContext, ITERATE)
  return Reflect.get(proto, 'size', rawContext)
}
