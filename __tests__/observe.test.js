import { observe, observable, raw } from '@nx-js/observer-util'

describe('observe', () => {
  test('should run the passed function once (wrapped by a reaction)', () => {
    const fnSpy = jest.fn(() => {})
    observe(fnSpy)
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })

  test('should observe basic properties', () => {
    let dummy
    const counter = observable({ num: 0 })
    observe(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    counter.num = 7
    expect(dummy).toBe(7)
  })

  test('should observe multiple properties', () => {
    let dummy
    const counter = observable({ num1: 0, num2: 0 })
    observe(() => (dummy = counter.num1 + counter.num1 + counter.num2))

    expect(dummy).toBe(0)
    counter.num1 = counter.num2 = 7
    expect(dummy).toBe(21)
  })

  test('should handle multiple reactions', () => {
    let dummy1, dummy2
    const counter = observable({ num: 0 })
    observe(() => (dummy1 = counter.num))
    observe(() => (dummy2 = counter.num))

    expect(dummy1).toBe(0)
    expect(dummy2).toBe(0)
    counter.num++
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(1)
  })

  test('should observe nested properties', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    observe(() => (dummy = counter.nested.num))

    expect(dummy).toBe(0)
    counter.nested.num = 8
    expect(dummy).toBe(8)
  })

  test('should observe delete operations', () => {
    let dummy
    const obj = observable({ prop: 'value' })
    observe(() => (dummy = obj.prop))

    expect(dummy).toBe('value')
    delete obj.prop
    expect(dummy).toBe(undefined)
  })

  test('should observe has operations', () => {
    let dummy
    const obj = observable({ prop: 'value' })
    observe(() => (dummy = 'prop' in obj))

    expect(dummy).toBe(true)
    delete obj.prop
    expect(dummy).toBe(false)
    obj.prop = 12
    expect(dummy).toBe(true)
  })

  test('should observe properties on the prototype chain', () => {
    let dummy
    const counter = observable({ num: 0 })
    const parentCounter = observable({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    observe(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    delete counter.num
    expect(dummy).toBe(2)
    parentCounter.num = 4
    expect(dummy).toBe(4)
    counter.num = 3
    expect(dummy).toBe(3)
  })

  test('should observe has operations on the prototype chain', () => {
    let dummy
    const counter = observable({ num: 0 })
    const parentCounter = observable({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    observe(() => (dummy = 'num' in counter))

    expect(dummy).toBe(true)
    delete counter.num
    expect(dummy).toBe(true)
    delete parentCounter.num
    expect(dummy).toBe(false)
    counter.num = 3
    expect(dummy).toBe(true)
  })

  test('should observe inherited property accessors', () => {
    let dummy, parentDummy, hiddenValue
    const obj = observable({})
    const parent = observable({
      set prop (value) {
        hiddenValue = value
      },
      get prop () {
        return hiddenValue
      }
    })
    Object.setPrototypeOf(obj, parent)
    observe(() => (dummy = obj.prop))
    observe(() => (parentDummy = parent.prop))

    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)
    obj.prop = 4
    expect(dummy).toBe(4)
    // this doesn't work, should it?
    // expect(parentDummy).toBe(4)
    parent.prop = 2
    expect(dummy).toBe(2)
    expect(parentDummy).toBe(2)
  })

  test('should observe function call chains', () => {
    let dummy
    const counter = observable({ num: 0 })
    observe(() => (dummy = getNum()))

    function getNum () {
      return counter.num
    }

    expect(dummy).toBe(0)
    counter.num = 2
    expect(dummy).toBe(2)
  })

  test('should observe iteration', () => {
    let dummy
    const list = observable(['Hello'])
    observe(() => (dummy = list.join(' ')))

    expect(dummy).toBe('Hello')
    list.push('World!')
    expect(dummy).toBe('Hello World!')
    list.shift()
    expect(dummy).toBe('World!')
  })

  test('should observe implicit array length changes', () => {
    let dummy
    const list = observable(['Hello'])
    observe(() => (dummy = list.join(' ')))

    expect(dummy).toBe('Hello')
    list[1] = 'World!'
    expect(dummy).toBe('Hello World!')
    list[3] = 'Hello!'
    expect(dummy).toBe('Hello World!  Hello!')
  })

  test('should observe sparse array mutations', () => {
    let dummy
    const list = observable([])
    list[1] = 'World!'
    observe(() => (dummy = list.join(' ')))

    expect(dummy).toBe(' World!')
    list[0] = 'Hello'
    expect(dummy).toBe('Hello World!')
    list.pop()
    expect(dummy).toBe('Hello')
  })

  test('should observe enumeration', () => {
    let dummy = 0
    const numbers = observable({ num1: 3 })
    observe(() => {
      dummy = 0
      for (const key in numbers) {
        dummy += numbers[key]
      }
    })

    expect(dummy).toBe(3)
    numbers.num2 = 4
    expect(dummy).toBe(7)
    delete numbers.num1
    expect(dummy).toBe(4)
  })

  test('should observe symbol keyed properties', () => {
    const key = Symbol('symbol keyed prop')
    let dummy, hasDummy
    const obj = observable({ [key]: 'value' })
    observe(() => (dummy = obj[key]))
    observe(() => (hasDummy = key in obj))

    expect(dummy).toBe('value')
    expect(hasDummy).toBe(true)
    obj[key] = 'newValue'
    expect(dummy).toBe('newValue')
    delete obj[key]
    expect(dummy).toBe(undefined)
    expect(hasDummy).toBe(false)
  })

  test('should not observe well-known symbol keyed properties', () => {
    const key = Symbol.isConcatSpreadable
    let dummy
    const array = observable([])
    observe(() => (dummy = array[key]))

    expect(array[key]).toBe(undefined)
    expect(dummy).toBe(undefined)
    array[key] = true
    expect(array[key]).toBe(true)
    expect(dummy).toBe(undefined)
  })

  test('should observe function valued properties', () => {
    let dummy
    const obj = observable({ func: () => {} })
    observe(() => (dummy = obj.func))

    expect(dummy).toBe(obj.func)
    obj.func = () => {}
    expect(dummy).toBe(obj.func)
  })

  test('should not observe set operations without a value change', () => {
    let hasDummy, getDummy
    const obj = observable({ prop: 'value' })

    const getSpy = jest.fn(() => (getDummy = obj.prop))
    const hasSpy = jest.fn(() => (hasDummy = 'prop' in obj))
    observe(getSpy)
    observe(hasSpy)

    expect(getDummy).toBe('value')
    expect(hasDummy).toBe(true)
    obj.prop = 'value'
    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(hasSpy).toHaveBeenCalledTimes(1)
    expect(getDummy).toBe('value')
    expect(hasDummy).toBe(true)
  })

  test('should not observe raw mutations', () => {
    let dummy
    const obj = observable()
    observe(() => (dummy = raw(obj).prop))

    expect(dummy).toBe(undefined)
    obj.prop = 'value'
    expect(dummy).toBe(undefined)
  })

  test('should not be triggered by raw mutations', () => {
    let dummy
    const obj = observable()
    observe(() => (dummy = obj.prop))

    expect(dummy).toBe(undefined)
    raw(obj).prop = 'value'
    expect(dummy).toBe(undefined)
  })

  test('should not be triggered by inherited raw setters', () => {
    let dummy, parentDummy, hiddenValue
    const obj = observable({})
    const parent = observable({
      set prop (value) {
        hiddenValue = value
      },
      get prop () {
        return hiddenValue
      }
    })
    Object.setPrototypeOf(obj, parent)
    observe(() => (dummy = obj.prop))
    observe(() => (parentDummy = parent.prop))

    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)
    raw(obj).prop = 4
    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)
  })

  test('should avoid implicit infinite recursive loops with itself', () => {
    const counter = observable({ num: 0 })

    const counterSpy = jest.fn(() => counter.num++)
    observe(counterSpy)
    expect(counter.num).toBe(1)
    expect(counterSpy).toHaveBeenCalledTimes(1)
    counter.num = 4
    expect(counter.num).toBe(5)
    expect(counterSpy).toHaveBeenCalledTimes(2)
  })

  test('should allow explicitly recursive raw function loops', () => {
    const counter = observable({ num: 0 })

    // TODO: this should be changed to reaction loops, can it be done?
    const numSpy = jest.fn(() => {
      counter.num++
      if (counter.num < 10) {
        numSpy()
      }
    })
    observe(numSpy)

    expect(counter.num).toBe(10)
    expect(numSpy).toHaveBeenCalledTimes(10)
  })

  test('should avoid infinite loops with other reactions', () => {
    const nums = observable({ num1: 0, num2: 1 })

    const spy1 = jest.fn(() => (nums.num1 = nums.num2))
    const spy2 = jest.fn(() => (nums.num2 = nums.num1))
    observe(spy1)
    observe(spy2)
    expect(nums.num1).toBe(1)
    expect(nums.num2).toBe(1)
    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
    nums.num2 = 4
    expect(nums.num1).toBe(4)
    expect(nums.num2).toBe(4)
    expect(spy1).toHaveBeenCalledTimes(2)
    expect(spy2).toHaveBeenCalledTimes(2)
    nums.num1 = 10
    expect(nums.num1).toBe(10)
    expect(nums.num2).toBe(10)
    expect(spy1).toHaveBeenCalledTimes(3)
    expect(spy2).toHaveBeenCalledTimes(3)
  })

  test('should return a new reactive version of the function', () => {
    function greet () {
      return 'Hello World'
    }
    const reaction1 = observe(greet)
    const reaction2 = observe(greet)
    expect(typeof reaction1).toBe('function')
    expect(typeof reaction2).toBe('function')
    expect(reaction1).not.toBe(greet)
    expect(reaction1).not.toBe(reaction2)
  })

  test('should wrap the passed function seamlessly', () => {
    function greet (name) {
      return `Hello ${this.prefix} ${name}!`
    }
    const reaction = observe(greet, { lazy: true })
    expect(reaction.call({ prefix: 'Mr.' }, 'World')).toBe('Hello Mr. World!')
  })

  test('should discover new branches while running automatically', () => {
    let dummy
    const obj = observable({ prop: 'value', run: false })

    const conditionalSpy = jest.fn(() => {
      dummy = obj.run ? obj.prop : 'other'
    })
    observe(conditionalSpy)

    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(1)
    obj.prop = 'Hi'
    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(1)
    obj.run = true
    expect(dummy).toBe('Hi')
    expect(conditionalSpy).toHaveBeenCalledTimes(2)
    obj.prop = 'World'
    expect(dummy).toBe('World')
    expect(conditionalSpy).toHaveBeenCalledTimes(3)
  })

  test('should discover new branches when running manually', () => {
    let dummy
    let run = false
    const obj = observable({ prop: 'value' })
    const reaction = observe(() => {
      dummy = run ? obj.prop : 'other'
    })

    expect(dummy).toBe('other')
    reaction()
    expect(dummy).toBe('other')
    run = true
    reaction()
    expect(dummy).toBe('value')
    obj.prop = 'World'
    expect(dummy).toBe('World')
  })

  test('should not be triggered by mutating a property, which is used in an inactive branch', () => {
    let dummy
    const obj = observable({ prop: 'value', run: true })

    const conditionalSpy = jest.fn(() => {
      dummy = obj.run ? obj.prop : 'other'
    })
    observe(conditionalSpy)

    expect(dummy).toBe('value')
    expect(conditionalSpy).toHaveBeenCalledTimes(1)
    obj.run = false
    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(2)
    obj.prop = 'value2'
    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(2)
  })

  test('should not double wrap if the passed function is a reaction', () => {
    const reaction = observe(() => {})
    const otherReaction = observe(reaction)
    expect(reaction).toBe(otherReaction)
  })

  test('should not run multiple times for a single mutation', () => {
    let dummy
    const obj = observable()
    const fnSpy = jest.fn(() => {
      for (const key in obj) {
        dummy = obj[key]
      }
      dummy = obj.prop
    })
    observe(fnSpy)

    expect(fnSpy).toHaveBeenCalledTimes(1)
    obj.prop = 16
    expect(dummy).toBe(16)
    expect(fnSpy).toHaveBeenCalledTimes(2)
  })

  test('should allow nested reactions', () => {
    const nums = observable({ num1: 0, num2: 1, num3: 2 })
    const dummy = {}

    const childSpy = jest.fn(() => (dummy.num1 = nums.num1))
    const childReaction = observe(childSpy)
    const parentSpy = jest.fn(() => {
      dummy.num2 = nums.num2
      childReaction()
      dummy.num3 = nums.num3
    })
    observe(parentSpy)

    expect(dummy).toStrictEqual({ num1: 0, num2: 1, num3: 2 })
    expect(parentSpy).toHaveBeenCalledTimes(1)
    expect(childSpy).toHaveBeenCalledTimes(2)
    // this should only call the childReaction
    nums.num1 = 4
    expect(dummy).toStrictEqual({ num1: 4, num2: 1, num3: 2 })
    expect(parentSpy).toHaveBeenCalledTimes(1)
    expect(childSpy).toHaveBeenCalledTimes(3)
    // this calls the parentReaction, which calls the childReaction once
    nums.num2 = 10
    expect(dummy).toStrictEqual({ num1: 4, num2: 10, num3: 2 })
    expect(parentSpy).toHaveBeenCalledTimes(2)
    expect(childSpy).toHaveBeenCalledTimes(4)
    // this calls the parentReaction, which calls the childReaction once
    nums.num3 = 7
    expect(dummy).toStrictEqual({ num1: 4, num2: 10, num3: 7 })
    expect(parentSpy).toHaveBeenCalledTimes(3)
    expect(childSpy).toHaveBeenCalledTimes(5)
  })
})

describe('options', () => {
  describe('lazy', () => {
    test('should not run the passed function, if set to true', () => {
      const fnSpy = jest.fn(() => {})
      observe(fnSpy, { lazy: true })
      expect(fnSpy).toHaveBeenCalledTimes(0)
    })

    test('should default to false', () => {
      const fnSpy = jest.fn(() => {})
      observe(fnSpy)
      expect(fnSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('scheduler', () => {
    test('should call the scheduler function with the reaction instead of running it sync', () => {
      const counter = observable({ num: 0 })
      const fn = jest.fn(() => counter.num)
      const scheduler = jest.fn(() => {})
      const reaction = observe(fn, { scheduler })

      expect(fn).toHaveBeenCalledTimes(1)
      expect(scheduler).toHaveBeenCalledTimes(0)
      counter.num++
      expect(fn).toHaveBeenCalledTimes(1)
      expect(scheduler).toHaveBeenCalledTimes(1)
      expect(scheduler).toHaveBeenCalledWith(reaction)
    })

    test('should call scheduler.add with the reaction instead of running it sync', () => {
      const counter = observable({ num: 0 })
      const fn = jest.fn(() => counter.num)
      const scheduler = { add: jest.fn(() => {}), delete: () => {} }
      const reaction = observe(fn, { scheduler })

      expect(fn).toHaveBeenCalledTimes(1)
      expect(scheduler.add).toHaveBeenCalledTimes(0)
      counter.num++
      expect(fn).toHaveBeenCalledTimes(1)
      expect(scheduler.add).toHaveBeenCalledTimes(1)
      expect(scheduler.add).toHaveBeenCalledWith(reaction)
    })
  })

  test('should not error when a DOM element is added', () => {
    let dummy = null
    const observed = observable({ obj: null })
    observe(() => (dummy = observed.obj && observed.obj.nodeType))

    expect(dummy).toBe(null)
    observed.obj = document
    expect(dummy).toBe(9)
  })
})
