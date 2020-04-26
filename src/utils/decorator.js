export const NemoObservableInfo = Symbol('nemo-observable-info')
export function decoratorFactory (wrapperFn) {
  return function (target, propertyKey, descriptor) {
    if (!propertyKey) {
      // 1. use as function wrapper
      return wrapperFn(target)
    }
    // 2. use as a decorator
    if (descriptor && typeof descriptor.value === 'function') {
      // 2.1 use as class method decorator
      descriptor.value = wrapperFn(descriptor.value)
      return
    }
    // 2.2 use as class setter decorator
    const v = Object.getOwnPropertyDescriptor(target, propertyKey)
    if (v) {
      if ('get' in v) {
        target[NemoObservableInfo] = {
          ...target[NemoObservableInfo],
          [propertyKey]: true
        }
        v.get = wrapperFn(v.get)
      }
      if ('set' in v) {
        target[NemoObservableInfo] = {
          ...target[NemoObservableInfo],
          [propertyKey]: true
        }
        v.set = wrapperFn(v.set)
      }
      return v
    } else {
      // 2.3 use as class normal attribute decorator
      // must be arrow function
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
}
