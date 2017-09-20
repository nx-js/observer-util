import { expect } from 'chai'
import { spy } from './utils'
import { observe, unobserve, observable, nextRun } from '@nx-js/observer-util'

describe('observe', () => {
  it('should throw TypeError on invalid first argument', () => {
    expect(() => observe(12)).to.throw(TypeError)
    expect(() => observe({})).to.throw(TypeError)
    expect(() => observe()).to.throw(TypeError)
  })

  it('should observe basic properties', async () => {
    let dummy
    const counter = observable({ num: 0 })
    const reaction = observe(() => (dummy = counter.num))

    await nextRun(reaction)
    expect(dummy).to.equal(0)
    counter.num = 7
    await nextRun(reaction)
    expect(dummy).to.equal(7)
  })

  it('should observe multiple properties', async () => {
    let dummy
    const counter = observable({ num1: 0, num2: 0, num3: 0 })
    const reaction = observe(
      () => (dummy = counter.num1 + counter.num2 + counter.num3)
    )

    await nextRun(reaction)
    expect(dummy).to.equal(0)
    counter.num1 = counter.num2 = counter.num3 = 7
    await nextRun(reaction)
    expect(dummy).to.equal(21)
  })

  it('should handle multiple reactions', async () => {
    let dummy1, dummy2
    const counter = observable({ num: 0 })
    const reaction1 = observe(() => (dummy1 = counter.num))
    const reaction2 = observe(() => (dummy2 = counter.num))

    await Promise.all([nextRun(reaction1), nextRun(reaction2)])
    expect(dummy1).to.equal(0)
    expect(dummy2).to.equal(0)
    counter.num++
    await Promise.all([nextRun(reaction1), nextRun(reaction2)])
    expect(dummy1).to.equal(1)
    expect(dummy2).to.equal(1)
  })

  it('should observe nested properties', async () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const reaction = observe(() => (dummy = counter.nested.num))

    await nextRun(reaction)
    expect(dummy).to.equal(0)
    counter.nested.num = 8
    await nextRun(reaction)
    expect(dummy).to.equal(8)
  })

  it('should observe delete operations', async () => {
    let dummy
    const obj = observable({ prop: 'value' })
    const reaction = observe(() => (dummy = obj.prop))

    await nextRun(reaction)
    expect(dummy).to.equal('value')
    delete obj.prop
    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
  })

  it('should observe properties on the prototype chain', async () => {
    let dummy
    const counter = observable({ num: 0 })
    const parentCounter = observable({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    const reaction = observe(() => (dummy = counter.num))

    await nextRun(reaction)
    expect(dummy).to.equal(0)
    delete counter.num
    await nextRun(reaction)
    expect(dummy).to.equal(2)
    parentCounter.num = 4
    await nextRun(reaction)
    expect(dummy).to.equal(4)
    counter.num = 3
    await nextRun(reaction)
    expect(dummy).to.equal(3)
  })

  it('should observe function call chains', async () => {
    let dummy
    const counter = observable({ num: 0 })
    const reaction = observe(() => (dummy = getNum()))

    function getNum () {
      return counter.num
    }

    await nextRun(reaction)
    expect(dummy).to.equal(0)
    counter.num = 2
    await nextRun(reaction)
    expect(dummy).to.equal(2)
  })

  it('should observe iteration', async () => {
    let dummy
    const list = observable(['Hello'])
    const reaction = observe(() => (dummy = list.join(' ')))

    await nextRun(reaction)
    expect(dummy).to.equal('Hello')
    list.push('World!')
    await nextRun(reaction)
    expect(dummy).to.equal('Hello World!')
    list.shift()
    await nextRun(reaction)
    expect(dummy).to.equal('World!')
  })

  it('should observe enumeration', async () => {
    let dummy = 0
    const numbers = observable({ num1: 3 })
    const reaction = observe(() => {
      dummy = 0
      for (let key in numbers) {
        dummy += numbers[key]
      }
    })

    await nextRun(reaction)
    expect(dummy).to.equal(3)
    numbers.num2 = 4
    await nextRun(reaction)
    expect(dummy).to.equal(7)
    delete numbers.num1
    await nextRun(reaction)
    expect(dummy).to.equal(4)
  })

  it('should not observe symbol keyed properties', async () => {
    const key = Symbol('symbol keyed prop')
    let dummy
    const obj = observable({ [key]: 'value' })
    const reaction = observe(() => (dummy = obj[key]))

    await nextRun(reaction)
    expect(dummy).to.equal('value')
    obj[key] = 'newValue'
    await nextRun(reaction)
    expect(dummy).to.equal('value')
    delete obj[key]
    await nextRun(reaction)
    expect(dummy).to.equal('value')
  })

  it('should not observe function valued properties', async () => {
    const oldFunc = () => {}
    const newFunc = () => {}

    let dummy
    const obj = observable({ func: oldFunc })
    const reaction = observe(() => (dummy = obj.func))

    await nextRun(reaction)
    expect(dummy).to.equal(oldFunc)
    obj.func = newFunc
    await nextRun(reaction)
    expect(dummy).to.equal(oldFunc)
  })

  it('should not observe set operations without a value change', async () => {
    let dummy
    const obj = observable({ prop: 'value' })

    const propSpy = spy(() => (dummy = obj.prop))
    const reaction = observe(propSpy)

    await nextRun(reaction)
    expect(dummy).to.equal('value')
    obj.prop = 'value'
    await nextRun(reaction)
    expect(propSpy.callCount).to.equal(1)
    expect(dummy).to.equal('value')
  })

  it('should not observe $raw mutations', async () => {
    let dummy
    const obj = observable()
    const reaction = observe(() => (dummy = obj.$raw.prop))

    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
    obj.prop = 'value'
    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
  })

  it('should not be triggered by $raw mutations', async () => {
    let dummy
    const obj = observable()
    const reaction = observe(() => (dummy = obj.prop))

    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
    obj.$raw.prop = 'value'
    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
  })

  it('should rerun maximum once per stack', async () => {
    let dummy
    const nums = observable({ num1: 0, num2: 0 })

    const numsSpy = spy(() => (dummy = nums.num1 + nums.num2))
    const reaction = observe(numsSpy)

    await nextRun(reaction)
    expect(numsSpy.callCount).to.equal(1)
    expect(dummy).to.equal(0)
    nums.num1 = 1
    nums.num2 = 3
    nums.num1 = 2
    await nextRun(reaction)
    expect(numsSpy.callCount).to.equal(2)
    expect(dummy).to.equal(5)
  })

  it('should avoid infinite loops', async () => {
    const obj1 = observable({ prop: 'value1' })
    const obj2 = observable({ prop: 'value2' })

    const spy1 = spy(() => (obj1.prop = obj2.prop))
    const spy2 = spy(() => (obj2.prop = obj1.prop))
    const reaction1 = observe(spy1)
    const reaction2 = observe(spy2)

    await Promise.all([nextRun(reaction1), nextRun(reaction2)])
    expect(obj1.prop).to.equal('value2')
    expect(obj2.prop).to.equal('value2')
    expect(spy1.callCount).to.equal(1)
    expect(spy2.callCount).to.equal(1)
    obj1.prop = 'Hello'
    await Promise.all([nextRun(reaction1), nextRun(reaction2)])
    expect(obj2.prop).to.equal('Hello')
    expect(spy1.callCount).to.equal(2)
    expect(spy2.callCount).to.equal(2)
    obj2.prop = 'World!'
    await Promise.all([nextRun(reaction1), nextRun(reaction2)])
    expect(obj1.prop).to.equal('World!')
    expect(spy1.callCount).to.equal(3)
    expect(spy2.callCount).to.equal(3)
  })

  it('should return the passed function', () => {
    const fn = () => {}
    const reaction = observe(fn)
    expect(reaction).to.equal(fn)
  })

  it('should simply run the function once on multiple observation of the same function', async () => {
    let dummy
    const counter = observable({ num: 0 })
    const counterSpy = spy(() => (dummy = counter.num))
    const reaction1 = observe(counterSpy)
    const reaction2 = observe(counterSpy)
    expect(reaction1).to.equal(reaction2)

    await nextRun(reaction1)
    expect(counterSpy.callCount).to.equal(2)
    counter.num++
    await nextRun(reaction1)
    expect(dummy).to.equal(1)
    expect(counterSpy.callCount).to.equal(3)
  })

  it('should be able to re-observe unobserved functions', async () => {
    let dummy = 0
    const counter = observable({ num: 0 })
    const reaction = observe(() => (dummy = counter.num))

    await nextRun(reaction)
    expect(dummy).to.equal(0)
    counter.num++
    await nextRun(reaction)
    expect(dummy).to.equal(1)
    unobserve(reaction)
    counter.num++
    await nextRun(reaction)
    expect(dummy).to.equal(1)
    observe(reaction)
    await nextRun(reaction)
    expect(dummy).to.equal(2)
    counter.num++
    await nextRun(reaction)
    expect(dummy).to.equal(3)
  })

  it('should execute in first-tigger order', async () => {
    let dummy = ''
    const obj = observable({ prop1: 'val1', prop2: 'val2', prop3: 'val3' })

    const reaction1 = observe(() => (dummy += obj.prop1))
    const reaction2 = observe(() => (dummy += obj.prop2))
    const reaction3 = observe(() => (dummy += obj.prop3))

    await Promise.all([
      nextRun(reaction1),
      nextRun(reaction2),
      nextRun(reaction3)
    ])
    expect(dummy).to.equal('val1val2val3')
    dummy = ''
    obj.prop2 = 'p'
    obj.prop1 = 'p1'
    obj.prop3 = 'p3'
    obj.prop2 = 'p2'
    await Promise.all([
      nextRun(reaction1),
      nextRun(reaction2),
      nextRun(reaction3)
    ])
    expect(dummy).to.equal('p2p1p3')
  })

  it('should not be triggered by mutating a property, which is used in an inactive branch', async () => {
    let dummy
    const obj = observable({ prop: 'value', run: true })

    const conditionalSpy = spy(() => {
      dummy = obj.run ? obj.prop : 'other'
    })
    const reaction = observe(conditionalSpy)

    await nextRun(reaction)
    expect(dummy).to.equal('value')
    expect(conditionalSpy.callCount).to.equal(1)
    obj.run = false
    await nextRun(reaction)
    expect(dummy).to.equal('other')
    expect(conditionalSpy.callCount).to.equal(2)
    obj.prop = 'value2'
    await nextRun(reaction)
    expect(dummy).to.equal('other')
    expect(conditionalSpy.callCount).to.equal(2)
  })
})
