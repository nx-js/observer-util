/* eslint no-unused-expressions: 0, no-unused-vars: 0 */

import chai from 'chai'
const { expect } = chai
import {
  observable,
  isObservable,
  observe,
  raw
} from '@yunfengdie/observer-util'
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

  it('should wrap object values with observables when requested from a reaction', () => {
    const key = {}
    const key2 = {}
    const map = observable(new Map())
    map.set(key, {})
    map.set(key2, {})

    expect(isObservable(map.get(key))).to.be.false
    expect(isObservable(map.get(key2))).to.be.false
    observe(() => expect(isObservable(map.get(key))).to.be.true)
    expect(isObservable(map.get(key))).to.be.true
    expect(isObservable(map.get(key2))).to.be.false
  })
})
