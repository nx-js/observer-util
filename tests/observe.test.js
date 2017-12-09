import { expect } from 'chai'
import { spy } from './utils'
import { observe, observable, raw } from '@nx-js/observer-util'

describe('observe', () => {
  it('should throw a TypeError when the first argument is not a function', () => {
    expect(() => observe(12)).to.throw(TypeError)
    expect(() => observe({})).to.throw(TypeError)
    expect(() => observe()).to.throw(TypeError)
  })

  it('should throw a TypeError when the first argument is a reaction', () => {
    const reaction = observe(() => {})
    expect(() => observe(reaction)).to.throw(TypeError)
  })

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

  it('should not observe symbol keyed properties', () => {
    const key = Symbol('symbol keyed prop')
    let dummy
    const obj = observable({ [key]: 'value' })
    observe(() => (dummy = obj[key]))

    expect(dummy).to.equal('value')
    obj[key] = 'newValue'
    expect(dummy).to.equal('value')
    delete obj[key]
    expect(dummy).to.equal('value')
  })

  it('should not observe function valued properties', () => {
    const oldFunc = () => {}
    const newFunc = () => {}

    let dummy
    const obj = observable({ func: oldFunc })
    observe(() => (dummy = obj.func))

    expect(dummy).to.equal(oldFunc)
    obj.func = newFunc
    expect(dummy).to.equal(oldFunc)
  })

  it('should not observe set operations without a value change', () => {
    let dummy
    const obj = observable({ prop: 'value' })

    const propSpy = spy(() => (dummy = obj.prop))
    observe(propSpy)

    expect(dummy).to.equal('value')
    obj.prop = 'value'
    expect(propSpy.callCount).to.equal(1)
    expect(dummy).to.equal('value')
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

  it('should not react on observable mutations in reactions', () => {
    const counter = observable({ num: 0 })

    const counterSpy = spy(() => counter.num++)
    observe(counterSpy)
    expect(counter.num).to.equal(1)
    expect(counterSpy.callCount).to.equal(1)
    counter.num = 4
    expect(counter.num).to.equal(5)
    expect(counterSpy.callCount).to.equal(2)
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

  it('should keep the return value of the function', () => {
    const reaction = observe(() => 'Hello World')
    const result = reaction()
    expect(result).to.equal('Hello World')
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
})

describe('options', () => {
  it('should throw a TypeError when the second argument is not an options object', () => {
    const fn = () => {}
    expect(() => observe(fn, null)).to.throw(TypeError)
    expect(() => observe(fn, 'string')).to.throw(TypeError)
    expect(() => observe(fn)).to.not.throw()
    expect(() => observe(fn, {})).to.not.throw()
  })

  describe('lazy', () => {
    it('should throw if options.lazy is not a boolean or undefined', () => {
      const fn = () => {}
      expect(() => observe(fn, { lazy: null })).to.throw(TypeError)
      expect(() => observe(fn, { lazy: 'true' })).to.throw(TypeError)
      expect(() => observe(fn, { lazy: undefined })).to.not.throw()
      expect(() => observe(fn, { lazy: false })).to.not.throw()
    })

    it('should not run the passed function, if set to true', () => {
      const fnSpy = spy(() => {})
      observe(fnSpy, { lazy: true })
      expect(fnSpy.callCount).to.equal(0)
    })
  })

  describe('scheduler', () => {
    it('should throw if options.scheduler is not a function, object or undefined', () => {
      const fn = () => {}
      const scheduler = () => {}
      expect(() => observe(fn, { scheduler: null })).to.throw(TypeError)
      expect(() => observe(fn, { scheduler: true })).to.throw(TypeError)
      expect(() => observe(fn, { scheduler })).to.not.throw()
      expect(() => observe(fn, { scheduler: undefined })).to.not.throw()
    })

    it('should throw if options.scheduler object does not have an add and delete method', () => {
      const fn = () => {}
      const add = () => {}
      const deleteFn = () => {}
      expect(() => observe(fn, { scheduler: {} })).to.throw(TypeError)
      expect(() => observe(fn, { scheduler: { add } })).to.throw(TypeError)
      expect(() => observe(fn, { scheduler: { add, delete: deleteFn } })).to.not.throw()
    })

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
      expect(scheduler.args).to.eql([reaction])
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
      expect(scheduler.add.args).to.eql([reaction])
    })
  })

  it('should not error when a DOM element is added', async () => {
    let dummy = null
    const observed = observable({ obj: null })
    observe(() => (dummy = observed.obj && observed.obj.nodeType))

    await nextTick()
    expect(dummy).to.equal(null)
    observed.obj = document
    await nextTick()
    expect(dummy).to.equal(9)
  })
})
