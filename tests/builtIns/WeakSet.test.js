import { expect } from 'chai'
import { observable, observe } from '@nx-js/observer-util'
import { spy } from '../utils'

describe('WeakSet', () => {
  it('should be a proper JS WeakSet', () => {
    const set = observable(new WeakSet())
    expect(set).to.be.instanceOf(WeakSet)
    expect(set.$raw).to.be.instanceOf(WeakSet)
  })

  it('should observe mutations', () => {
    let dummy
    const value = {}
    const set = observable(new WeakSet())
    const reaction = observe(() => (dummy = set.has(value)))

    expect(dummy).to.equal(false)
    set.add(value)
    expect(dummy).to.equal(true)
    set.delete(value)
    expect(dummy).to.equal(false)
  })

  it('should observe custom property mutations', () => {
    let dummy
    const set = observable(new WeakSet())
    const reaction = observe(() => (dummy = set.customProp))

    expect(dummy).to.equal(undefined)
    set.customProp = 'Hello World'
    expect(dummy).to.equal('Hello World')
    delete set.customProp
    expect(dummy).to.equal(undefined)
  })

  it('should not observe non value changing mutations', () => {
    let dummy
    const value = {}
    const set = observable(new WeakSet())
    const setSpy = spy(() => (dummy = set.has(value)))
    const reaction = observe(setSpy)

    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(1)
    set.add(value)
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.add(value)
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.delete(value)
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
    set.delete(value)
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
  })

  it('should not observe $raw data', () => {
    const value = {}
    let dummy
    const set = observable(new WeakSet())
    const reaction = observe(() => (dummy = set.$raw.has(value)))

    expect(dummy).to.equal(false)
    set.add(value)
    expect(dummy).to.equal(false)
  })

  it('should not be triggered by $raw mutations', () => {
    const value = {}
    let dummy
    const set = observable(new WeakSet())
    const reaction = observe(() => (dummy = set.has(value)))

    expect(dummy).to.equal(false)
    set.$raw.add(value)
    expect(dummy).to.equal(false)
  })
})
