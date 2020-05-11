import {
  observable,
  observe,
  isObservable,
  raw,
  proxyHandlers,
  collectionHandlers,
  reactionHandlers
} from '@nx-js/observer-util'
import { spyObject } from './utils'

describe('observable', () => {
  test('should return a new observable when no argument is provided', () => {
    const obs = observable()
    expect(isObservable(obs)).toBe(true)
  })

  test('should return an observable wrapping of an object argument', () => {
    const obj = { prop: 'value' }
    const obs = observable(obj)
    expect(obs).not.toBe(obj)
    expect(isObservable(obs)).toBe(true)
  })

  test('should return an observable wrapping of a function argument', () => {
    const fn = () => 10
    const obs = observable(fn)
    expect(obs).not.toBe(fn)
    expect(isObservable(obs)).toBe(true)
  })

  test('should return an observable instance when an observable class is instantiated', () => {
    class NestedClass {}
    class MyClass {
      static Nested = NestedClass;
    }
    // add an empty custom handlers object to enable
    // deep observable wrapping without reactions
    const ObsClass = observable(MyClass, {})
    expect(isObservable(MyClass)).toBe(false)
    expect(isObservable(ObsClass)).toBe(true)
    expect(isObservable(new MyClass())).toBe(false)
    expect(isObservable(new ObsClass())).toBe(true)
    expect(isObservable(MyClass.Nested)).toBe(false)
    expect(isObservable(ObsClass.Nested)).toBe(true)
    expect(isObservable(new MyClass.Nested())).toBe(false)
    expect(isObservable(new ObsClass.Nested())).toBe(true)
  })

  test('should return the argument if it is already an observable', () => {
    const obs1 = observable()
    const obs2 = observable(obs1)
    expect(obs1).toBe(obs2)
  })

  test('should return the same observable wrapper when called repeatedly with the same argument', () => {
    const obj = { prop: 'value' }
    const obs1 = observable(obj)
    const obs2 = observable(obj)
    expect(obs1).toBe(obs2)
  })

  test('should wrap nested data with observable at get time', () => {
    const obs = observable({ nested: { prop: 1 } })
    expect(isObservable(obs.nested)).toBe(true)
  })

  test('should not throw on none writable nested objects, should simply not observe them instead', () => {
    let dummy
    const obj = {}
    Object.defineProperty(obj, 'prop', {
      value: { num: 12 },
      writable: false,
      configurable: false
    })
    const obs = observable(obj)
    expect(() => observe(() => (dummy = obs.prop.num))).not.toThrow()
    expect(dummy).toBe(12)
    obj.prop.num = 13
    expect(dummy).toBe(12)
  })

  test('should never let observables leak into the underlying raw object', () => {
    const obj = {}
    const obs = observable(obj)
    obs.nested1 = {}
    obs.nested2 = observable()
    expect(isObservable(obj.nested1)).toBe(false)
    expect(isObservable(obj.nested2)).toBe(false)
    expect(isObservable(obs.nested1)).toBe(true)
    expect(isObservable(obs.nested2)).toBe(true)
  })

  describe('custom handlers', () => {
    test('should run the provided custom Proxy handlers - even when they are not in an observed branch', () => {
      const { spy: handlersSpy, reset: resetHandlersSpy } = spyObject(
        proxyHandlers
      )
      const obs = observable(
        {
          // use properties in a nested object to make sure
          // that proxy traps are called when nested objects would not normally
          // be wrapped by observable (because they are not used in reaction)
          nested: {
            prop: 12,
            method: () => 12,
            ClassProp: class ClassProp {}
          }
        },
        { proxyHandlers: handlersSpy }
      )

      // get trap
      expect(obs.nested.prop).toBe(12)
      // 1 for nested and 1 for props
      expect(handlersSpy.get).toHaveBeenCalledTimes(2)
      resetHandlersSpy()

      // has trap
      expect('prop' in obs.nested).toBe(true)
      expect(handlersSpy.has).toHaveBeenCalledTimes(1)
      resetHandlersSpy()

      // ownKeys trap
      // eslint-disable-next-line no-unused-vars
      for (const key in obs.nested) {
      }
      expect(handlersSpy.ownKeys).toHaveBeenCalledTimes(1)
      resetHandlersSpy()

      // delete trap
      delete obs.nested.prop
      expect(obs.nested.prop).toBe(undefined)
      expect(handlersSpy.deleteProperty).toHaveBeenCalledTimes(1)

      // set trap
      obs.nested.prop = 20
      expect(obs.nested.prop).toBe(20)
      expect(handlersSpy.set).toHaveBeenCalledTimes(1)
      resetHandlersSpy()

      // apply trap
      expect(obs.nested.method()).toBe(12)
      expect(handlersSpy.apply).toHaveBeenCalledTimes(1)
      resetHandlersSpy()

      // construct trap
      // eslint-disable-next-line no-new
      new obs.nested.ClassProp()
      expect(handlersSpy.construct).toHaveBeenCalledTimes(1)
      resetHandlersSpy()

      // getPrototypeOf and setPrototypeOf traps
      Object.setPrototypeOf(obs.nested, Object.getPrototypeOf(obs.nested))
      expect(handlersSpy.getPrototypeOf).toHaveBeenCalledTimes(1)
      expect(handlersSpy.setPrototypeOf).toHaveBeenCalledTimes(1)
      resetHandlersSpy()

      // defineProperty trap
      Object.defineProperty(obs, 'definedProp', {
        writable: false,
        value: 100
      })
      expect(obs.definedProp).toBe(100)
      expect(handlersSpy.defineProperty).toHaveBeenCalledTimes(1)
      resetHandlersSpy()

      // getOwnPropertyDescriptor trap
      expect(Object.getOwnPropertyDescriptor(obs, 'definedProp').writable).toBe(
        false
      )
      expect(handlersSpy.getOwnPropertyDescriptor).toHaveBeenCalledTimes(1)
      resetHandlersSpy()

      // isExtensible and preventExtensions trap
      Object.preventExtensions(obs.nested)
      expect(Object.isExtensible(obs.nested)).toBe(false)
      expect(handlersSpy.isExtensible).toHaveBeenCalledTimes(1)
      expect(handlersSpy.preventExtensions).toHaveBeenCalledTimes(1)
      resetHandlersSpy()
    })
  })

  test('should run the provided ES6 collection custom handlers', () => {
    const { spy: handlersSpy, reset: resetHandlersSpy } = spyObject(
      collectionHandlers
    )
    const obsMap = observable(new Map(), {
      collectionHandlers: handlersSpy
    })
    const obsSet = observable(new Set(), {
      collectionHandlers: handlersSpy
    })

    // set method
    obsMap.set('prop', 1)
    expect(handlersSpy.set).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // add method
    obsSet.add(1)
    expect(handlersSpy.add).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // delete method
    obsSet.delete(1)
    expect(handlersSpy.delete).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // clear method
    obsSet.clear()
    expect(handlersSpy.clear).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // has method
    obsMap.has('prop')
    expect(handlersSpy.has).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // get method
    obsMap.get('prop')
    expect(handlersSpy.get).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // forEach method
    obsMap.forEach(() => {})
    expect(handlersSpy.forEach).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // keys method
    obsMap.keys()
    expect(handlersSpy.keys).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // values method
    obsMap.values()
    expect(handlersSpy.values).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // entries method
    obsMap.entries()
    expect(handlersSpy.entries).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // size property
    // eslint-disable-next-line no-unused-expressions
    obsMap.size
    expect(handlersSpy.size).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    // iterator
    // eslint-disable-next-line no-unused-vars
    for (const item of obsSet) {
    }
    expect(handlersSpy[Symbol.iterator]).toHaveBeenCalledTimes(1)
    resetHandlersSpy()
  })

  test('should run the provided transformReactions handler', () => {
    // eslint-disable-next-line no-unused-vars
    let dummy1, dummy2
    const { spy: handlersSpy, reset: resetHandlersSpy } = spyObject(
      reactionHandlers
    )
    const obj = { prop: 12 }
    const obs = observable(obj, { reactionHandlers: handlersSpy })

    const reaction1 = observe(() => (dummy1 = obs.prop))
    const reaction2 = observe(() => (dummy2 = obs.prop))
    resetHandlersSpy()

    obs.prop = 20
    expect(handlersSpy.transformReactions).toHaveBeenCalledTimes(1)
    expect(handlersSpy.transformReactions).toHaveBeenCalledWith(obj, 'prop', [
      reaction1,
      reaction2
    ])
  })

  // TODO: fix this test case
  test.skip('should prefer the handler of the observable it was get from in case of a collisison', () => {
    const { spy: handlersSpy1, reset: resetHandlersSpy1 } = spyObject(
      proxyHandlers
    )
    const { spy: handlersSpy2, reset: resetHandlersSpy2 } = spyObject(
      proxyHandlers
    )

    const obs1 = observable(
      { nested: { prop: 1 } },
      { proxyHandlers: handlersSpy1 }
    )
    const obs2 = observable({}, { proxyHandlers: handlersSpy2 })
    obs2.nested = obs1.nested
    resetHandlersSpy1()
    resetHandlersSpy2()

    expect(obs1.nested.prop).toBe(1)
    expect(handlersSpy1.get).toHaveBeenCalledTimes(2)
    expect(handlersSpy2.get).toHaveBeenCalledTimes(0)
    resetHandlersSpy1()
    resetHandlersSpy2()

    expect(obs2.nested.prop).toBe(1)
    expect(handlersSpy1.get).toHaveBeenCalledTimes(0)
    expect(handlersSpy2.get).toHaveBeenCalledTimes(2)
    resetHandlersSpy1()
    resetHandlersSpy2()
  })

  test('should fall back to default handlers for missing custom handlers when only some custom handlers are provided', () => {
    let dummy
    // no custom get handler provided
    const obs = observable({ prop: 1 }, {})

    observe(() => (dummy = obs.prop))
    expect(dummy).toBe(1)
    obs.prop = 12
    expect(dummy).toBe(12)
  })

  test('should run the provided custom handlers inside ES6 collection entries', () => {
    const { spy: handlersSpy, reset: resetHandlersSpy } = spyObject(Reflect)
    const obs = observable(new Map([['nested', { prop: 11 }]]), {
      proxyHandlers: handlersSpy
    })

    expect(obs.get('nested').prop).toBe(11)
    expect(handlersSpy.get).toHaveBeenCalledTimes(1)
    resetHandlersSpy()

    obs.get('nested').prop = 20
    expect(handlersSpy.set).toHaveBeenCalledTimes(1)
    resetHandlersSpy()
  })
})

describe('isObservable', () => {
  test('should return true if an observable is passed as argument', () => {
    const obs = observable()
    const isObs = isObservable(obs)
    expect(isObs).toBe(true)
  })

  test('should return false if a non observable is passed as argument', () => {
    const obj1 = { prop: 'value' }
    const obj2 = new Proxy({}, {})
    const isObs1 = isObservable(obj1)
    const isObs2 = isObservable(obj2)
    expect(isObs1).toBe(false)
    expect(isObs2).toBe(false)
  })

  test('should return false if a primitive is passed as argument', () => {
    expect(isObservable(12)).toBe(false)
  })
})

describe('raw', () => {
  test('should return the raw non-reactive object', () => {
    const obj = {}
    const obs = observable(obj)
    expect(raw(obs)).toBe(obj)
    expect(raw(obj)).toBe(obj)
  })

  test('should work with plain primitives', () => {
    expect(raw(12)).toBe(12)
  })
})
