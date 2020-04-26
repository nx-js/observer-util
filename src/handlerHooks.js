// default handlers are exposed in the public API
// to allow devs to augment them instead of overwriting them
// they are frozen as they can only be used but must not be overwritten
// devs should use the setHandlers function for that
export const defaultHandlers = Object.freeze({
  orderReactions (reactions) {
    return reactions
  },
  runReaction (target, context, args) {
    return Reflect.apply(target, context, args)
  },
  get (target, key, receiver) {
    return Reflect.get(target, key, receiver)
  },
  has (target, key) {
    return Reflect.has(target, key)
  },
  ownKeys (target) {
    return Reflect.ownKeys(target)
  },
  set (target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver)
  },
  deleteProperty (target, key) {
    return Reflect.deleteProperty(target, key)
  }
})

export let handlers = defaultHandlers

// add the new handlers to the existing ones
export function setHandlers (newHandlers) {
  handlers = { ...handlers, ...newHandlers }
}

// reset all handlers to the default ones
export function clearHandlers () {
  handlers = { ...defaultHandlers }
}
