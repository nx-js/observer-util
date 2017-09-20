import { expect } from 'chai'
import { spy } from './utils'
import { observable, observe, unobserve, nextTick } from '@nx-js/observer-util'

describe('unobserve', () => {
  it('should unobserve the observed function', async () => {
    let dummy
    const counter = observable({ num: 0 })
    const counterSpy = spy(() => (dummy = counter.num))
    const observer = observe(counterSpy)

    await nextTick()
    expect(counterSpy.callCount).to.equal(1)
    counter.num = 'Hello'
    await nextTick()
    expect(counterSpy.callCount).to.equal(2)
    expect(dummy).to.equal('Hello')
    unobserve(observer)
    counter.num = 'World'
    await nextTick()
    expect(counterSpy.callCount).to.equal(2)
    expect(dummy).to.equal('Hello')
  })

  it('should unobserve when the same key is used multiple times', async () => {
    let dummy
    const user = observable({ name: { name: 'Bob' } })
    const nameSpy = spy(() => (dummy = user.name.name))
    const observer = observe(nameSpy)

    await nextTick()
    expect(nameSpy.callCount).to.equal(1)
    user.name.name = 'Dave'
    await nextTick()
    expect(nameSpy.callCount).to.equal(2)
    expect(dummy).to.equal('Dave')
    unobserve(observer)
    user.name.name = 'Ann'
    await nextTick()
    expect(nameSpy.callCount).to.equal(2)
    expect(dummy).to.equal('Dave')
  })

  it('should unobserve multiple observers for the same target and key', async () => {
    let dummy
    const counter = observable({ num: 0 })

    const observer1 = observe(() => (dummy = counter.num))
    const observer2 = observe(() => (dummy = counter.num))
    const observer3 = observe(() => (dummy = counter.num))

    await nextTick()
    expect(dummy).to.equal(0)
    unobserve(observer1)
    unobserve(observer2)
    unobserve(observer3)
    counter.num++
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should unobserve even if the function is registered for the stack', async () => {
    let dummy
    const counter = observable({ num: 0 })
    const counterSpy = spy(() => (dummy = counter.num))
    const observer = observe(counterSpy)

    await nextTick()
    expect(counterSpy.callCount).to.equal(1)
    counter.num = 'Hello'
    await nextTick()
    expect(dummy).to.equal('Hello')
    expect(counterSpy.callCount).to.equal(2)
    counter.num = 'World'
    unobserve(observer)
    await nextTick()
    expect(dummy).to.equal('Hello')
    expect(counterSpy.callCount).to.equal(2)
  })
})
