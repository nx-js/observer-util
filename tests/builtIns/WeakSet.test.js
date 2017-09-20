import { expect } from 'chai'
import { observable, observe, nextRun } from '@nx-js/observer-util'
import { spy } from '../utils'

describe('WeakSet', () => {
  it('should be a proper JS WeakSet', () => {
    const set = observable(new WeakSet())
    expect(set).to.be.instanceOf(WeakSet)
    expect(set.$raw).to.be.instanceOf(WeakSet)
  })

  it('should observe mutations', async () => {
    let dummy
    const value = {}
    const set = observable(new WeakSet())
    const reaction = observe(() => (dummy = set.has(value)))

    await nextRun(reaction)
    expect(dummy).to.equal(false)
    set.add(value)
    await nextRun(reaction)
    expect(dummy).to.equal(true)
    set.delete(value)
    await nextRun(reaction)
    expect(dummy).to.equal(false)
  })

  it('should observe custom property mutations', async () => {
    let dummy
    const set = observable(new WeakSet())
    const reaction = observe(() => (dummy = set.customProp))

    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
    set.customProp = 'Hello World'
    await nextRun(reaction)
    expect(dummy).to.equal('Hello World')
    delete set.customProp
    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
  })

  it('should not observe non value changing mutations', async () => {
    let dummy
    const value = {}
    const set = observable(new WeakSet())

    const setSpy = spy(() => (dummy = set.has(value)))
    const reaction = observe(setSpy)

    await nextRun(reaction)
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(1)
    set.add(value)
    await nextRun(reaction)
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.add(value)
    await nextRun(reaction)
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.delete(value)
    await nextRun(reaction)
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
    set.delete(value)
    await nextRun(reaction)
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
  })

  it('should not observe $raw data', async () => {
    const value = {}
    let dummy
    const set = observable(new WeakSet())
    const reaction = observe(() => (dummy = set.$raw.has(value)))

    await nextRun(reaction)
    expect(dummy).to.equal(false)
    set.add(value)
    await nextRun(reaction)
    expect(dummy).to.equal(false)
  })

  it('should not be triggered by $raw mutations', async () => {
    const value = {}
    let dummy
    const set = observable(new WeakSet())
    const reaction = observe(() => (dummy = set.has(value)))

    await nextRun(reaction)
    expect(dummy).to.equal(false)
    set.$raw.add(value)
    await nextRun(reaction)
    expect(dummy).to.equal(false)
  })
})
