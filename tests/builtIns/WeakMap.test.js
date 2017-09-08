import { expect } from 'chai'
import { observable, observe, nextTick } from '../../src'
import { spy } from '../utils'

describe('WeakMap', () => {
  it('should be a proper JS WeakMap', () => {
    const map = observable(new WeakMap())
    expect(map).to.be.instanceOf(WeakMap)
    expect(map.$raw).to.be.instanceOf(WeakMap)
  })

  it('should observe mutations', async () => {
    let dummy
    const key = {}
    const map = observable(new WeakMap())
    observe(() => (dummy = map.get(key)))

    await nextTick()
    expect(dummy).to.equal(undefined)
    map.set(key, 'value')
    await nextTick()
    expect(dummy).to.equal('value')
    map.delete(key)
    await nextTick()
    expect(dummy).to.equal(undefined)
  })

  it('should observe custom property mutations', async () => {
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = map.customProp))

    await nextTick()
    expect(dummy).to.equal(undefined)
    map.customProp = 'Hello World'
    await nextTick()
    expect(dummy).to.equal('Hello World')
    delete map.customProp
    await nextTick()
    expect(dummy).to.equal(undefined)
  })

  it('should not observe non value changing mutations', async () => {
    let dummy
    const key = {}
    const map = observable(new WeakMap())
    const mapSpy = spy(() => (dummy = map.get(key)))
    observe(mapSpy)

    await nextTick()
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(1)
    map.set(key, 'value')
    await nextTick()
    expect(dummy).to.equal('value')
    expect(mapSpy.callCount).to.equal(2)
    map.set(key, 'value')
    await nextTick()
    expect(dummy).to.equal('value')
    expect(mapSpy.callCount).to.equal(2)
    map.delete(key)
    await nextTick()
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(3)
    map.delete(key)
    await nextTick()
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(3)
  })

  it('should not observe $raw data', async () => {
    const key = {}
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = map.$raw.get(key)))

    await nextTick()
    expect(dummy).to.equal(undefined)
    map.set(key, 'Hello')
    await nextTick()
    expect(dummy).to.equal(undefined)
    map.delete(key)
    await nextTick()
    expect(dummy).to.equal(undefined)
  })

  it('should not be triggered by $raw mutations', async () => {
    const key = {}
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = map.get(key)))

    await nextTick()
    expect(dummy).to.equal(undefined)
    map.$raw.set(key, 'Hello')
    await nextTick()
    expect(dummy).to.equal(undefined)
    map.$raw.delete(key)
    await nextTick()
    expect(dummy).to.equal(undefined)
  })
})
