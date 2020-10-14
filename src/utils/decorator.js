export const NemoObservableInfo = Symbol('nemo-observable-info')

export function decoratorFactory (functionWrapperFn, propertyInitWrapperFn) {
  return function (target, propertyKey, descriptor) {
    // #region 一个参数：直接当 function 使用
    if (!propertyKey) {
      if (typeof target === 'string') {
        // 自定义 name 的
        const customName = target
        return decoratorFactory(
          (...args) => functionWrapperFn(...args, customName),
          (...args) => propertyInitWrapperFn(...args, customName)
        )
      }
      // 不自定义 name 的
      return functionWrapperFn(target)
    }
    // #endregion

    // #region 三个参数：当 MethodDecorator 使用
    if (descriptor && typeof descriptor.value === 'function') {
      // 一定是 decorator 打在 class method 上，直接包裹
      descriptor.value = functionWrapperFn(descriptor.value)
      return
    }
    // #endregion

    // #region 两个参数：当 PropertyDecorator 使用
    const v = Object.getOwnPropertyDescriptor(target, propertyKey)
    if (v) {
      // 一定是 decorator 打在 class getter setter 属性
      if ('get' in v && v.get !== undefined) {
        target[NemoObservableInfo] = {
          ...target[NemoObservableInfo],
          [propertyKey]: true
        }
        v.get = functionWrapperFn(v.get)
      }
      if ('set' in v && v.set !== undefined) {
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
  // #endregion
}
