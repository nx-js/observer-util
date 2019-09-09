import chai from 'chai'
import { spy } from './utils'
import { observe, observable, raw, config } from 'nemo-observer-util'
const { expect } = chai

describe('observe', () => {
  it('should run the passed function once (wrapped by a reaction)', () => {
    const fnSpy = spy(() => {})
    observe(fnSpy)
    expect(fnSpy.callCount).to.equal(1)
  })

  it('should observe basic properties', () => {
    let dummy
    const counter = observable({ num: 0 })
    observe(() => (dummy = counter.num))

    expect(dummy).to.equal(0)
    counter.num = 7
    expect(dummy).to.equal(7)
  })

  it('should observe multiple properties', () => {
    let dummy
    const counter = observable({ num1: 0, num2: 0 })
    observe(() => (dummy = counter.num1 + counter.num1 + counter.num2))

    expect(dummy).to.equal(0)
    counter.num1 = counter.num2 = 7
    expect(dummy).to.equal(21)
  })

  it('should handle multiple reactions', () => {
    let dummy1, dummy2
    const counter = observable({ num: 0 })
    observe(() => (dummy1 = counter.num))
    observe(() => (dummy2 = counter.num))

    expect(dummy1).to.equal(0)
    expect(dummy2).to.equal(0)
    counter.num++
    expect(dummy1).to.equal(1)
    expect(dummy2).to.equal(1)
  })

  it('should observe nested properties', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    observe(() => (dummy = counter.nested.num))

    expect(dummy).to.equal(0)
    counter.nested.num = 8
    expect(dummy).to.equal(8)
  })

  it('should observe delete operations', () => {
    let dummy
    const obj = observable({ prop: 'value' })
    observe(() => (dummy = obj.prop))

    expect(dummy).to.equal('value')
    delete obj.prop
    expect(dummy).to.equal(undefined)
  })

  it('should observe has operations', () => {
    let dummy
    const obj = observable({ prop: 'value' })
    observe(() => (dummy = 'prop' in obj))

    expect(dummy).to.equal(true)
    delete obj.prop
    expect(dummy).to.equal(false)
    obj.prop = 12
    expect(dummy).to.equal(true)
  })

  it('should observe properties on the prototype chain', () => {
    let dummy
    const counter = observable({ num: 0 })
    const parentCounter = observable({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    observe(() => (dummy = counter.num))

    expect(dummy).to.equal(0)
    delete counter.num
    expect(dummy).to.equal(2)
    parentCounter.num = 4
    expect(dummy).to.equal(4)
    counter.num = 3
    expect(dummy).to.equal(3)
  })

  it('should observe has operations on the prototype chain', () => {
    let dummy
    const counter = observable({ num: 0 })
    const parentCounter = observable({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    observe(() => (dummy = 'num' in counter))

    expect(dummy).to.equal(true)
    delete counter.num
    expect(dummy).to.equal(true)
    delete parentCounter.num
    expect(dummy).to.equal(false)
    counter.num = 3
    expect(dummy).to.equal(true)
  })

  it('should observe inherited property accessors', () => {
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

    expect(dummy).to.equal(undefined)
    expect(parentDummy).to.equal(undefined)
    obj.prop = 4
    expect(dummy).to.equal(4)
    // this doesn't work, should it?
    // expect(parentDummy).to.equal(4)
    parent.prop = 2
    expect(dummy).to.equal(2)
    expect(parentDummy).to.equal(2)
  })

  it('should observe function call chains', () => {
    let dummy
    const counter = observable({ num: 0 })
    observe(() => (dummy = getNum()))

    function getNum () {
      return counter.num
    }

    expect(dummy).to.equal(0)
    counter.num = 2
    expect(dummy).to.equal(2)
  })

  it('should observe iteration', () => {
    let dummy
    const list = observable(['Hello'])
    observe(() => (dummy = list.join(' ')))

    expect(dummy).to.equal('Hello')
    list.push('World!')
    expect(dummy).to.equal('Hello World!')
    list.shift()
    expect(dummy).to.equal('World!')
  })

  it('should observe implicit array length changes', () => {
    let dummy
    const list = observable(['Hello'])
    observe(() => (dummy = list.join(' ')))

    expect(dummy).to.equal('Hello')
    list[1] = 'World!'
    expect(dummy).to.equal('Hello World!')
    list[3] = 'Hello!'
    expect(dummy).to.equal('Hello World!  Hello!')
  })

  it('should observe sparse array mutations', () => {
    let dummy
    const list = observable([])
    list[1] = 'World!'
    observe(() => (dummy = list.join(' ')))

    expect(dummy).to.equal(' World!')
    list[0] = 'Hello'
    expect(dummy).to.equal('Hello World!')
    list.pop()
    expect(dummy).to.equal('Hello')
  })

  it('should observe enumeration', () => {
    let dummy = 0
    const numbers = observable({ num1: 3 })
    observe(() => {
      dummy = 0
      for (let key in numbers) {
        dummy += numbers[key]
      }
    })

    expect(dummy).to.equal(3)
    numbers.num2 = 4
    expect(dummy).to.equal(7)
    delete numbers.num1
    expect(dummy).to.equal(4)
  })

  it('should observe symbol keyed properties', () => {
    const key = Symbol('symbol keyed prop')
    let dummy, hasDummy
    const obj = observable({ [key]: 'value' })
    observe(() => (dummy = obj[key]))
    observe(() => (hasDummy = key in obj))

    expect(dummy).to.equal('value')
    expect(hasDummy).to.equal(true)
    obj[key] = 'newValue'
    expect(dummy).to.equal('newValue')
    delete obj[key]
    expect(dummy).to.equal(undefined)
    expect(hasDummy).to.equal(false)
  })

  it('should not observe well-known symbol keyed properties', () => {
    const key = Symbol.isConcatSpreadable
    let dummy
    const array = observable([])
    observe(() => (dummy = array[key]))

    expect(array[key]).to.equal(undefined)
    expect(dummy).to.equal(undefined)
    array[key] = true
    expect(array[key]).to.equal(true)
    expect(dummy).to.equal(undefined)
  })

  it('should observe function valued properties', () => {
    const oldFunc = () => {}
    const newFunc = () => {}

    let dummy
    const obj = observable({ func: oldFunc })
    observe(() => (dummy = obj.func))

    expect(dummy).to.equal(oldFunc)
    obj.func = newFunc
    expect(dummy).to.equal(newFunc)
  })

  it('should not observe set operations without a value change', () => {
    let hasDummy, getDummy
    const obj = observable({ prop: 'value' })

    const getSpy = spy(() => (getDummy = obj.prop))
    const hasSpy = spy(() => (hasDummy = 'prop' in obj))
    observe(getSpy)
    observe(hasSpy)

    expect(getDummy).to.equal('value')
    expect(hasDummy).to.equal(true)
    obj.prop = 'value'
    expect(getSpy.callCount).to.equal(2)
    expect(hasSpy.callCount).to.equal(2)
    expect(getDummy).to.equal('value')
    expect(hasDummy).to.equal(true)
  })

  it('should not observe raw mutations', () => {
    let dummy
    const obj = observable()
    observe(() => (dummy = raw(obj).prop))

    expect(dummy).to.equal(undefined)
    obj.prop = 'value'
    expect(dummy).to.equal(undefined)
  })

  it('should not be triggered by raw mutations', () => {
    let dummy
    const obj = observable()
    observe(() => (dummy = obj.prop))

    expect(dummy).to.equal(undefined)
    raw(obj).prop = 'value'
    expect(dummy).to.equal(undefined)
  })

  it('should not be triggered by inherited raw setters', () => {
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

    expect(dummy).to.equal(undefined)
    expect(parentDummy).to.equal(undefined)
    raw(obj).prop = 4
    expect(dummy).to.equal(undefined)
    expect(parentDummy).to.equal(undefined)
  })

  it('should avoid implicit infinite recursive loops with itself', () => {
    const counter = observable({ num: 0 })

    const counterSpy = spy(() => counter.num++)
    observe(counterSpy)
    expect(counter.num).to.equal(1)
    expect(counterSpy.callCount).to.equal(1)
    counter.num = 4
    expect(counter.num).to.equal(5)
    expect(counterSpy.callCount).to.equal(2)
  })

  it('should allow explicitly recursive raw function loops', () => {
    const counter = observable({ num: 0 })

    // TODO: this should be changed to reaction loops, can it be done?
    const numSpy = spy(() => {
      counter.num++
      if (counter.num < 10) {
        numSpy()
      }
    })
    observe(numSpy)

    expect(counter.num).to.eql(10)
    expect(numSpy.callCount).to.equal(10)
  })

  it('should avoid infinite loops with other reactions', () => {
    config({
      skipSameValueChange: true
    })
    const nums = observable({ num1: 0, num2: 1 })

    const spy1 = spy(() => (nums.num1 = nums.num2))
    const spy2 = spy(() => (nums.num2 = nums.num1))
    observe(spy1)
    observe(spy2)
    expect(nums.num1).to.equal(1)
    expect(nums.num2).to.equal(1)
    expect(spy1.callCount).to.equal(1)
    expect(spy2.callCount).to.equal(1)
    nums.num2 = 4
    expect(nums.num1).to.equal(4)
    expect(nums.num2).to.equal(4)
    expect(spy1.callCount).to.equal(2)
    expect(spy2.callCount).to.equal(2)
    nums.num1 = 10
    expect(nums.num1).to.equal(10)
    expect(nums.num2).to.equal(10)
    expect(spy1.callCount).to.equal(3)
    expect(spy2.callCount).to.equal(3)
    config({
      skipSameValueChange: false
    })
  })

  it('should return a new reactive version of the function', () => {
    function greet () {
      return 'Hello World'
    }
    const reaction1 = observe(greet)
    const reaction2 = observe(greet)
    expect(reaction1).to.be.a('function')
    expect(reaction2).to.be.a('function')
    expect(reaction1).to.not.equal(greet)
    expect(reaction1).to.not.equal(reaction2)
  })

  it('should wrap the passed function seamlessly', () => {
    function greet (name) {
      return `Hello ${this.prefix} ${name}!`
    }
    const reaction = observe(greet, { lazy: true })
    expect(reaction.call({ prefix: 'Mr.' }, 'World')).to.eql(
      'Hello Mr. World!'
    )
  })

  it('should discover new branches while running automatically', () => {
    let dummy
    const obj = observable({ prop: 'value', run: false })

    const conditionalSpy = spy(() => {
      dummy = obj.run ? obj.prop : 'other'
    })
    observe(conditionalSpy)

    expect(dummy).to.equal('other')
    expect(conditionalSpy.callCount).to.equal(1)
    obj.prop = 'Hi'
    expect(dummy).to.equal('other')
    expect(conditionalSpy.callCount).to.equal(1)
    obj.run = true
    expect(dummy).to.equal('Hi')
    expect(conditionalSpy.callCount).to.equal(2)
    obj.prop = 'World'
    expect(dummy).to.equal('World')
    expect(conditionalSpy.callCount).to.equal(3)
  })

  it('should discover new branches when running manually', () => {
    let dummy
    let run = false
    const obj = observable({ prop: 'value' })
    const reaction = observe(() => {
      dummy = run ? obj.prop : 'other'
    })

    expect(dummy).to.equal('other')
    reaction()
    expect(dummy).to.equal('other')
    run = true
    reaction()
    expect(dummy).to.equal('value')
    obj.prop = 'World'
    expect(dummy).to.equal('World')
  })

  it('should not be triggered by mutating a property, which is used in an inactive branch', () => {
    let dummy
    const obj = observable({ prop: 'value', run: true })

    const conditionalSpy = spy(() => {
      dummy = obj.run ? obj.prop : 'other'
    })
    observe(conditionalSpy)

    expect(dummy).to.equal('value')
    expect(conditionalSpy.callCount).to.equal(1)
    obj.run = false
    expect(dummy).to.equal('other')
    expect(conditionalSpy.callCount).to.equal(2)
    obj.prop = 'value2'
    expect(dummy).to.equal('other')
    expect(conditionalSpy.callCount).to.equal(2)
  })

  it('should not double wrap if the passed function is a reaction', () => {
    const reaction = observe(() => {})
    const otherReaction = observe(reaction)
    expect(reaction).to.equal(otherReaction)
  })

  it('should not run multiple times for a single mutation', () => {
    let dummy
    const obj = observable()
    const fnSpy = spy(() => {
      for (const key in obj) {
        dummy = obj[key]
      }
      dummy = obj.prop
    })
    observe(fnSpy)

    expect(fnSpy.callCount).to.equal(1)
    obj.prop = 16
    expect(dummy).to.equal(16)
    expect(fnSpy.callCount).to.equal(2)
  })

  it('should allow nested reactions', () => {
    const nums = observable({ num1: 0, num2: 1, num3: 2 })
    const dummy = {}

    const childSpy = spy(() => (dummy.num1 = nums.num1))
    const childReaction = observe(childSpy)
    const parentSpy = spy(() => {
      dummy.num2 = nums.num2
      childReaction()
      dummy.num3 = nums.num3
    })
    observe(parentSpy)

    expect(dummy).to.eql({ num1: 0, num2: 1, num3: 2 })
    expect(parentSpy.callCount).to.equal(1)
    expect(childSpy.callCount).to.equal(2)
    // this should only call the childReaction
    nums.num1 = 4
    expect(dummy).to.eql({ num1: 4, num2: 1, num3: 2 })
    expect(parentSpy.callCount).to.equal(1)
    expect(childSpy.callCount).to.equal(3)
    // this calls the parentReaction, which calls the childReaction once
    nums.num2 = 10
    expect(dummy).to.eql({ num1: 4, num2: 10, num3: 2 })
    expect(parentSpy.callCount).to.equal(2)
    expect(childSpy.callCount).to.equal(4)
    // this calls the parentReaction, which calls the childReaction once
    nums.num3 = 7
    expect(dummy).to.eql({ num1: 4, num2: 10, num3: 7 })
    expect(parentSpy.callCount).to.equal(3)
    expect(childSpy.callCount).to.equal(5)
  })
})

describe('options', () => {
  describe('lazy', () => {
    it('should not run the passed function, if set to true', () => {
      const fnSpy = spy(() => {})
      observe(fnSpy, { lazy: true })
      expect(fnSpy.callCount).to.equal(0)
    })

    it('should default to false', () => {
      const fnSpy = spy(() => {})
      observe(fnSpy)
      expect(fnSpy.callCount).to.equal(1)
    })
  })

  describe('scheduler', () => {
    it('should call the scheduler function with the reaction instead of running it sync', () => {
      const counter = observable({ num: 0 })
      const fn = spy(() => counter.num)
      const scheduler = spy(() => {})
      const reaction = observe(fn, { scheduler })

      expect(fn.callCount).to.equal(1)
      expect(scheduler.callCount).to.equal(0)
      counter.num++
      expect(fn.callCount).to.equal(1)
      expect(scheduler.callCount).to.eql(1)
      expect(scheduler.lastArgs).to.eql([reaction])
    })

    it('should call scheduler.add with the reaction instead of running it sync', () => {
      const counter = observable({ num: 0 })
      const fn = spy(() => counter.num)
      const scheduler = { add: spy(() => {}), delete: () => {} }
      const reaction = observe(fn, { scheduler })

      expect(fn.callCount).to.equal(1)
      expect(scheduler.add.callCount).to.equal(0)
      counter.num++
      expect(fn.callCount).to.equal(1)
      expect(scheduler.add.callCount).to.eql(1)
      expect(scheduler.add.lastArgs).to.eql([reaction])
    })
  })

  it('should not error when a DOM element is added', async () => {
    let dummy = null
    const observed = observable({ obj: null })
    observe(() => (dummy = observed.obj && observed.obj.nodeType))

    expect(dummy).to.equal(null)
    observed.obj = document
    expect(dummy).to.equal(9)
  })
})

describe('config', () => {
  beforeEach(() => {
    config({
      skipSameValueChange: true
    })
  })
  afterEach(() => {
    config({
      skipSameValueChange: false
    })
  })
  it('get', () => {
    const c = config()
    expect(c).to.eql({
      skipSameValueChange: true
    })
  })

  it('set', () => {
    const c = config({
      skipSameValueChange: false
    })
    expect(c).to.eql({
      skipSameValueChange: false
    })
  })

  it('should observe set operations without a value change when skipSameValueChange', () => {
    let hasDummy, getDummy
    const obj = observable({ prop: 'value' })

    const getSpy = spy(() => (getDummy = obj.prop))
    const hasSpy = spy(() => (hasDummy = 'prop' in obj))
    observe(getSpy)
    observe(hasSpy)

    expect(getDummy).to.equal('value')
    expect(hasDummy).to.equal(true)
    obj.prop = 'value'
    expect(getSpy.callCount).to.equal(1)
    expect(hasSpy.callCount).to.equal(1)
    expect(getDummy).to.equal('value')
    expect(hasDummy).to.equal(true)
  })
})
