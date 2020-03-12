export function decoratorFactory (wrapperFn) {
  return function (target, propertyKey, descriptor) {
    if (!propertyKey) {
      // 1. use as function wrapper
      return wrapperFn(target)
    }
    // 2. use as a decorator
    if (propertyKey in target) {
      // 2.1 use as class method decorator
      descriptor.value = wrapperFn(descriptor.value)
      return
    }

    // 2.2 use as class attribute decorator
    const internalPropertyKey = Symbol(propertyKey)
    Object.defineProperty(target, propertyKey, {
      set: function (value) {
        if (!(internalPropertyKey in this)) {
          // must be attribute init setter，wrap it to a action
          value = wrapperFn(value)
        } else {
          // modify in running, not wrapper it，since decorator should just run in init phase
        }
        this[internalPropertyKey] = value
      },
      get: function () {
        return this[internalPropertyKey]
      }
    })
  }
}
