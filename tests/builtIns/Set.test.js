/* eslint no-unused-expressions: 0, no-unused-vars: 0 */

import { expect } from 'chai'
import { observable, isObservable, observe, raw } from '@yunfengdie/observer-util'
import { spy } from '../utils'

describe('Set', () => {
  it('should be a proper JS Set', () => {
    const set = observable(new Set())
    expect(set).to.be.instanceOf(Set)
    expect(raw(set)).to.be.instanceOf(Set)
  })

  it('should observe mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.has('value')))

    expect(dummy).to.equal(false)
    set.add('value')
    expect(dummy).to.equal(true)
    set.delete('value')
    expect(dummy).to.equal(false)
  })

  it('should observe for of iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (let num of set) {
        dummy += num
      }
    })

    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    expect(dummy).to.equal(3)
    set.delete(2)
    expect(dummy).to.equal(1)
    set.clear()
    expect(dummy).to.equal(0)
  })

  it('should observe forEach iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      set.forEach(num => (dummy += num))
    })

    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    expect(dummy).to.equal(3)
    set.delete(2)
    expect(dummy).to.equal(1)
    set.clear()
    expect(dummy).to.equal(0)
  })

  it('should observe values iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (let num of set.values()) {
        dummy += num
      }
    })

    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    expect(dummy).to.equal(3)
    set.delete(2)
    expect(dummy).to.equal(1)
    set.clear()
    expect(dummy).to.equal(0)
  })

  it('should observe keys iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (let num of set.keys()) {
        dummy += num
      }
    })

    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    expect(dummy).to.equal(3)
    set.delete(2)
    expect(dummy).to.equal(1)
    set.clear()
    expect(dummy).to.equal(0)
  })

  it('should observe entries iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (let [key, num] of set.entries()) {
        dummy += num
      }
    })

    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    expect(dummy).to.equal(3)
    set.delete(2)
    expect(dummy).to.equal(1)
    set.clear()
    expect(dummy).to.equal(0)
  })

  it('should be triggered by clearing', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.has('key')))

    expect(dummy).to.equal(false)
    set.add('key')
    expect(dummy).to.equal(true)
    set.clear()
    expect(dummy).to.equal(false)
  })

  it('should not observe custom property mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.customProp))

    expect(dummy).to.equal(undefined)
    set.customProp = 'Hello World'
    expect(dummy).to.equal(undefined)
  })

  it('should observe size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.size))

    expect(dummy).to.equal(0)
    set.add('value')
    set.add('value2')
    expect(dummy).to.equal(2)
    set.delete('value')
    expect(dummy).to.equal(1)
    set.clear()
    expect(dummy).to.equal(0)
  })

  it('should not observe non value changing mutations', () => {
    let dummy
    const set = observable(new Set())
    const setSpy = spy(() => (dummy = set.has('value')))
    observe(setSpy)

    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(1)
    set.add('value')
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.add('value')
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.delete('value')
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
    set.delete('value')
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
    set.clear()
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
  })

  it('should not observe raw data', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = raw(set).has('value')))

    expect(dummy).to.equal(false)
    set.add('value')
    expect(dummy).to.equal(false)
  })

  it('should not observe raw iterations', () => {
    let dummy = 0
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (let [num] of raw(set).entries()) {
        dummy += num
      }
      for (let num of raw(set).keys()) {
        dummy += num
      }
      for (let num of raw(set).values()) {
        dummy += num
      }
      raw(set).forEach(num => {
        dummy += num
      })
      for (let num of raw(set)) {
        dummy += num
      }
    })

    expect(dummy).to.equal(0)
    set.add(2)
    set.add(3)
    expect(dummy).to.equal(0)
    set.delete(2)
    expect(dummy).to.equal(0)
  })

  it('should not be triggered by raw mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.has('value')))

    expect(dummy).to.equal(false)
    raw(set).add('value')
    expect(dummy).to.equal(false)
    dummy = true
    raw(set).delete('value')
    expect(dummy).to.equal(true)
    raw(set).clear()
    expect(dummy).to.equal(true)
  })

  it('should not observe raw size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = raw(set).size))

    expect(dummy).to.equal(0)
    set.add('value')
    expect(dummy).to.equal(0)
  })

  it('should not be triggered by raw size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.size))

    expect(dummy).to.equal(0)
    raw(set).add('value')
    expect(dummy).to.equal(0)
  })

  it('should support objects as key', () => {
    let dummy
    const key = {}
    const set = observable(new Set())
    const setSpy = spy(() => (dummy = set.has(key)))
    observe(setSpy)

    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(1)

    set.add({})
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(1)

    set.add(key)
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
  })

  it('should wrap object values with observables when iterated from a reaction', () => {
    const set = observable(new Set())
    set.add({})

    set.forEach(value => expect(isObservable(value)).to.be.false)
    for (let value of set) {
      expect(isObservable(value)).to.be.false
    }
    for (let [_, value] of set.entries()) {
      expect(isObservable(value)).to.be.false
    }
    for (let value of set.values()) {
      expect(isObservable(value)).to.be.false
    }

    observe(() => {
      set.forEach(value => expect(isObservable(value)).to.be.true)
      for (let value of set) {
        expect(isObservable(value)).to.be.true
      }
      for (let [_, value] of set.entries()) {
        expect(isObservable(value)).to.be.true
      }
      for (let value of set.values()) {
        expect(isObservable(value)).to.be.true
      }
    })

    set.forEach(value => expect(isObservable(value)).to.be.true)
    for (let value of set) {
      expect(isObservable(value)).to.be.true
    }
    for (let [_, value] of set.entries()) {
      expect(isObservable(value)).to.be.true
    }
    for (let value of set.values()) {
      expect(isObservable(value)).to.be.true
    }
  })
})
