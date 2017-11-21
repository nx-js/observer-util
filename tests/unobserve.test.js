import { expect } from 'chai'
import { spy } from './utils'
import { observable, observe, unobserve } from '@nx-js/observer-util'

describe('unobserve', () => {
  it('should unobserve the observed function', () => {
    let dummy
    const counter = observable({ num: 0 })
    const counterSpy = spy(() => (dummy = counter.num))
    const reaction = observe(counterSpy)

    expect(counterSpy.callCount).to.equal(1)
    counter.num = 'Hello'
    expect(counterSpy.callCount).to.equal(2)
    expect(dummy).to.equal('Hello')
    unobserve(reaction)
    counter.num = 'World'
    expect(counterSpy.callCount).to.equal(2)
    expect(dummy).to.equal('Hello')
  })

  it('should unobserve when the same key is used multiple times', () => {
    let dummy
    const user = observable({ name: { name: 'Bob' } })
    const nameSpy = spy(() => (dummy = user.name.name))
    const reaction = observe(nameSpy)

    expect(nameSpy.callCount).to.equal(1)
    user.name.name = 'Dave'
    expect(nameSpy.callCount).to.equal(2)
    expect(dummy).to.equal('Dave')
    unobserve(reaction)
    user.name.name = 'Ann'
    expect(nameSpy.callCount).to.equal(2)
    expect(dummy).to.equal('Dave')
  })

  it('should unobserve multiple reactions for the same target and key', () => {
    let dummy
    const counter = observable({ num: 0 })

    const reaction1 = observe(() => (dummy = counter.num))
    const reaction2 = observe(() => (dummy = counter.num))
    const reaction3 = observe(() => (dummy = counter.num))

    expect(dummy).to.equal(0)
    unobserve(reaction1)
    unobserve(reaction2)
    unobserve(reaction3)
    counter.num++
    expect(dummy).to.equal(0)
  })

  it('should unobserve even if the function is already queued', () => {
    // TODO -> check this with a queue -> I need a mode of waiting for this
    let dummy
    const counter = observable({ num: 0 })
    const counterSpy = spy(() => (dummy = counter.num))
    const reaction = observe(counterSpy)

    expect(counterSpy.callCount).to.equal(1)
    counter.num = 'Hello'

    expect(dummy).to.equal('Hello')
    expect(counterSpy.callCount).to.equal(2)
    counter.num = 'World'
    unobserve(reaction)

    expect(dummy).to.equal('Hello')
    expect(counterSpy.callCount).to.equal(2)
  })
})
