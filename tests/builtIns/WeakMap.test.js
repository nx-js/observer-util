import { expect } from 'chai'
import { observable, observe, raw } from '@nx-js/observer-util'
import { spy } from '../utils'

describe('WeakMap', () => {
  it('should be a proper JS WeakMap', () => {
    const map = observable(new WeakMap())
    expect(map).to.be.instanceOf(WeakMap)
    expect(raw(map)).to.be.instanceOf(WeakMap)
  })

  it('should observe mutations', () => {
    let dummy
    const key = {}
    const map = observable(new WeakMap())
    observe(() => (dummy = map.get(key)))

    expect(dummy).to.equal(undefined)
    map.set(key, 'value')
    expect(dummy).to.equal('value')
    map.set(key, 'value2')
    expect(dummy).to.equal('value2')
    map.delete(key)
    expect(dummy).to.equal(undefined)
  })

  it('should not observe custom property mutations', () => {
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = map.customProp))

    expect(dummy).to.equal(undefined)
    map.customProp = 'Hello World'
    expect(dummy).to.equal(undefined)
  })

  it('should not observe non value changing mutations', () => {
    let dummy
    const key = {}
    const map = observable(new WeakMap())
    const mapSpy = spy(() => (dummy = map.get(key)))
    observe(mapSpy)

    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(1)
    map.set(key, 'value')
    expect(dummy).to.equal('value')
    expect(mapSpy.callCount).to.equal(2)
    map.set(key, 'value')
    expect(dummy).to.equal('value')
    expect(mapSpy.callCount).to.equal(2)
    map.delete(key)
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(3)
    map.delete(key)
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(3)
  })

  it('should not observe raw data', () => {
    const key = {}
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = raw(map).get(key)))

    expect(dummy).to.equal(undefined)
    map.set(key, 'Hello')
    expect(dummy).to.equal(undefined)
    map.delete(key)
    expect(dummy).to.equal(undefined)
  })

  it('should not be triggered by raw mutations', () => {
    const key = {}
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = map.get(key)))

    expect(dummy).to.equal(undefined)
    raw(map).set(key, 'Hello')
    expect(dummy).to.equal(undefined)
    raw(map).delete(key)
    expect(dummy).to.equal(undefined)
  })
})
