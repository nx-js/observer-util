export const NemoObservableInfo = Symbol('nemo-observable-info')

export function decoratorFactory (functionWrapperFn, propertyInitWrapperFn) {
  return function (target, propertyKey, descriptor) {
    if (!propertyKey) {
      // 非装饰器使用场景，直接包裹
      return functionWrapperFn(target)
    }

    if (descriptor && typeof descriptor.value === 'function') {
      // 一定是 decorator 打在 class method 上，直接包裹
      descriptor.value = functionWrapperFn(descriptor.value)
      return
    }

    const v = Object.getOwnPropertyDescriptor(target, propertyKey)
    if (v) {
      // 一定是 decorator 打在 class getter setter 属性
      if ('get' in v) {
        target[NemoObservableInfo] = {
          ...target[NemoObservableInfo],
          [propertyKey]: true
        }
        v.get = functionWrapperFn(v.get)
      }
      if ('set' in v) {
        target[NemoObservableInfo] = {
          ...target[NemoObservableInfo],
          [propertyKey]: true
        }
        v.set = functionWrapperFn(v.set)
      }
      // getOwnPropertyDescriptor 拿到的东西直接修改无用，这里 return 新的交给 ts decorator 帮我们替换
      return v
    }
    // 一定是 decorator 打在 class property 上
    const internalPropertyKey = Symbol(propertyKey)
    Object.defineProperty(target, propertyKey, {
      set: function (value) {
        if (!(internalPropertyKey in this)) {
          // 如果属性值是函数，包裹一下，否则不处理
          value =
            typeof value === 'function' ? functionWrapperFn(value) : value
          // 对这个属性的初始值赋值过程也包裹一下
          propertyInitWrapperFn(() => {
            this[internalPropertyKey] = value
          })()
        } else {
          // 后续二次修改的过程不做特殊处理
          this[internalPropertyKey] = value
        }
      },
      get: function () {
        return this[internalPropertyKey]
      }
    })
  }
}
