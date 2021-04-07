import { rawToOptions } from './internals'

// Proxy trap related handlers
// this is a copy of the built-in Reflect object
// Reflect keys are not enumerable, so a simple { ...Reflect } spread does not work here
// we have to copy all Reflect handlers to the object instead
export const proxyHandlers = Object.freeze(
  Object.getOwnPropertyNames(Reflect).reduce(
    (handlers, key) => ({ ...handlers, [key]: Reflect[key] }),
    {}
  )
)

// ES6 collection method related handlers
export const collectionHandlers = Object.freeze({
  has: (target, ...args) => target.has(...args),
  get: (target, ...args) => target.get(...args),
  add: (target, ...args) => target.add(...args),
  set: (target, ...args) => target.set(...args),
  delete: (target, ...args) => target.delete(...args),
  clear: (target, ...args) => target.clear(...args),
  forEach: (target, ...args) => target.forEach(...args),
  keys: (target, ...args) => target.keys(...args),
  values: (target, ...args) => target.values(...args),
  entries: (target, ...args) => target.entries(...args),
  [Symbol.iterator]: (target, ...args) => target[Symbol.iterator](...args),
  size: (target) => target.size
})

export const reactionHandlers = Object.freeze({
  // order/filter reactions triggered by an atomic observable mutation
  transformReactions: (target, key, reactions) => reactions
})

const defaultHandlers = {
  proxyHandlers,
  collectionHandlers,
  reactionHandlers
}

export const runProxyHandler = (...args) =>
  runHandler('proxyHandlers', ...args)
export const runCollectionHandler = (...args) =>
  runHandler('collectionHandlers', ...args)
export const runReactionHandler = (...args) =>
  runHandler('reactionHandlers', ...args)

// runs the default or custom (user-provided) handler for the specific operation
function runHandler (handlers, name, target, ...args) {
  const options = rawToOptions.get(target)
  const handler =
    options?.[handlers]?.[name] || defaultHandlers[handlers][name]
  return handler(target, ...args)
}
