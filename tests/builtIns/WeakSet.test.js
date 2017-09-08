import { expect } from 'chai'
import { observable, observe, nextTick } from '../../src'
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
    observe(() => (dummy = set.has(value)))

    await nextTick()
    expect(dummy).to.equal(false)
    set.add(value)
    await nextTick()
    expect(dummy).to.equal(true)
    set.delete(value)
    await nextTick()
    expect(dummy).to.equal(false)
  })

  it('should observe custom property mutations', async () => {
    let dummy
    const set = observable(new WeakSet())
    observe(() => (dummy = set.customProp))

    await nextTick()
    expect(dummy).to.equal(undefined)
    set.customProp = 'Hello World'
    await nextTick()
    expect(dummy).to.equal('Hello World')
    delete set.customProp
    await nextTick()
    expect(dummy).to.equal(undefined)
  })

  it('should not observe non value changing mutations', async () => {
    let dummy
    const value = {}
    const set = observable(new WeakSet())

    const setSpy = spy(() => (dummy = set.has(value)))
    observe(setSpy)

    await nextTick()
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(1)
    set.add(value)
    await nextTick()
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.add(value)
    await nextTick()
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.delete(value)
    await nextTick()
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
    set.delete(value)
    await nextTick()
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
  })

  it('should not observe $raw data', async () => {
    const value = {}
    let dummy
    const set = observable(new WeakSet())
    observe(() => (dummy = set.$raw.has(value)))

    await nextTick()
    expect(dummy).to.equal(false)
    set.add(value)
    await nextTick()
    expect(dummy).to.equal(false)
  })

  it('should not be triggered by $raw mutations', async () => {
    const value = {}
    let dummy
    const set = observable(new WeakSet())
    observe(() => (dummy = set.has(value)))

    await nextTick()
    expect(dummy).to.equal(false)
    set.$raw.add(value)
    await nextTick()
    expect(dummy).to.equal(false)
  })
})
