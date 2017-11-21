import { expect } from 'chai'
import { spy } from './utils'
import { observe, unobserve, observable } from '@nx-js/observer-util'

describe('observe', () => {
  it('should throw TypeError on invalid first argument', () => {
    expect(() => observe(12)).to.throw(TypeError)
    expect(() => observe({})).to.throw(TypeError)
    expect(() => observe()).to.throw(TypeError)
  })

  it('should observe basic properties', () => {
    let dummy
    const counter = observable({ num: 0 })
    const reaction = observe(() => dummy = counter.num)

    expect(dummy).to.equal(0)
    counter.num = 7
    expect(dummy).to.equal(7)
  })

  it('should observe multiple properties', () => {
    let dummy
    const counter = observable({ num1: 0, num2: 0, num3: 0 })
    const reaction = observe(
      () => (dummy = counter.num1 + counter.num2 + counter.num3)
    )

    expect(dummy).to.equal(0)
    counter.num1 = counter.num2 = counter.num3 = 7
    expect(dummy).to.equal(21)
  })

  it('should handle multiple reactions', () => {
    let dummy1, dummy2
    const counter = observable({ num: 0 })
    const reaction1 = observe(() => (dummy1 = counter.num))
    const reaction2 = observe(() => (dummy2 = counter.num))

    expect(dummy1).to.equal(0)
    expect(dummy2).to.equal(0)
    counter.num++
    expect(dummy1).to.equal(1)
    expect(dummy2).to.equal(1)
  })

  it('should observe nested properties', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const reaction = observe(() => (dummy = counter.nested.num))


    expect(dummy).to.equal(0)
    counter.nested.num = 8
    expect(dummy).to.equal(8)
  })

  it('should observe delete operations', () => {
    let dummy
    const obj = observable({ prop: 'value' })
    const reaction = observe(() => (dummy = obj.prop))


    expect(dummy).to.equal('value')
    delete obj.prop
    expect(dummy).to.equal(undefined)
  })

  it('should observe properties on the prototype chain', () => {
    let dummy
    const counter = observable({ num: 0 })
    const parentCounter = observable({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    const reaction = observe(() => (dummy = counter.num))


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
    const reaction = observe(() => (dummy = getNum()))

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
    const reaction = observe(() => (dummy = list.join(' ')))


    expect(dummy).to.equal('Hello')
    list.push('World!')
    expect(dummy).to.equal('Hello World!')
    list.shift()
    expect(dummy).to.equal('World!')
  })

  it('should observe enumeration', () => {
    let dummy = 0
    const numbers = observable({ num1: 3 })
    const reaction = observe(() => {
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
    const reaction = observe(() => (dummy = obj[key]))

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
    const reaction = observe(() => (dummy = obj.func))

    expect(dummy).to.equal(oldFunc)
    obj.func = newFunc
    expect(dummy).to.equal(oldFunc)
  })

  it('should not observe set operations without a value change', () => {
    let dummy
    const obj = observable({ prop: 'value' })

    const propSpy = spy(() => (dummy = obj.prop))
    const reaction = observe(propSpy)

    expect(dummy).to.equal('value')
    obj.prop = 'value'
    expect(propSpy.callCount).to.equal(1)
    expect(dummy).to.equal('value')
  })

  it('should not observe $raw mutations', () => {
    let dummy
    const obj = observable()
    const reaction = observe(() => (dummy = obj.$raw.prop))

    expect(dummy).to.equal(undefined)
    obj.prop = 'value'
    expect(dummy).to.equal(undefined)
  })

  it('should not be triggered by $raw mutations', () => {
    let dummy
    const obj = observable()
    const reaction = observe(() => (dummy = obj.prop))

    expect(dummy).to.equal(undefined)
    obj.$raw.prop = 'value'
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

  it('should return a transparent reactive proxy of the function', () => {
    function greet (greeting, name) {
      return `${greeting} ${this.prefix} ${name}`
    }
    const reaction = observe(greet.bind({ prefix: 'Mr.' }, 'Hello'))
    expect(reaction).to.be.a('function')
    const result = reaction('World')
    expect(result).to.equal('Hello Mr. World')
  })

  it('should be able to re-observe unobserved functions', () => {
    let dummy = 0
    const counter = observable({ num: 0 })
    const reaction = observe(() => (dummy = counter.num))


    expect(dummy).to.equal(0)
    counter.num++
    expect(dummy).to.equal(1)
    unobserve(reaction)
    counter.num++
    expect(dummy).to.equal(1)
    // TODO fix this
    observe(reaction)
    expect(dummy).to.equal(2)
    counter.num++
    expect(dummy).to.equal(3)
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
    const reaction = observe(conditionalSpy)

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
