import { expect } from 'chai'
import { observable, observe } from '@nx-js/observer-util'
import { spy } from '../utils'

describe('Set', () => {
  it('should be a proper JS Set', () => {
    const set = observable(new Set())
    expect(set).to.be.instanceOf(Set)
    expect(set.$raw).to.be.instanceOf(Set)
  })

  it('should observe mutations', () => {
    let dummy
    const set = observable(new Set())
    const reaction = observe(() => (dummy = set.has('value')))

    expect(dummy).to.equal(false)
    set.add('value')
    expect(dummy).to.equal(true)
    set.delete('value')
    expect(dummy).to.equal(false)
  })

  it('should observe for of iteration', () => {
    let dummy
    const set = observable(new Set())
    const reaction = observe(() => {
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
    const reaction = observe(() => {
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
    const reaction = observe(() => {
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
    const reaction = observe(() => {
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
    const reaction = observe(() => {
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

  it('should observe custom property mutations', () => {
    let dummy
    const set = observable(new Set())
    const reaction = observe(() => (dummy = set.customProp))

    expect(dummy).to.equal(undefined)
    set.customProp = 'Hello World'
    expect(dummy).to.equal('Hello World')
    delete set.customProp
    expect(dummy).to.equal(undefined)
  })

  it('should observe size mutations', () => {
    let dummy
    const set = observable(new Set())
    const reaction = observe(() => (dummy = set.size))

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
    const reaction = observe(setSpy)

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

  it('should not observe $raw data', () => {
    let dummy
    const set = observable(new Set())
    const reaction = observe(() => (dummy = set.$raw.has('value')))

    expect(dummy).to.equal(false)
    set.add('value')
    expect(dummy).to.equal(false)
  })

  it('should not observe $raw iterations', () => {
    let dummy = 0
    const set = observable(new Set())
    const reaction = observe(() => {
      dummy = 0
      for (let [num] of set.$raw.entries()) {
        dummy += num
      }
      for (let num of set.$raw.keys()) {
        dummy += num
      }
      for (let num of set.$raw.values()) {
        dummy += num
      }
      set.$raw.forEach(num => {
        dummy += num
      })
      for (let num of set.$raw) {
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

  it('should not be triggered by $raw mutations', () => {
    let dummy
    const set = observable(new Set())
    const reaction = observe(() => (dummy = set.has('value')))

    expect(dummy).to.equal(false)
    set.$raw.add('value')
    expect(dummy).to.equal(false)
    dummy = true
    set.$raw.delete('value')
    expect(dummy).to.equal(true)
    set.$raw.clear()
    expect(dummy).to.equal(true)
  })

  it('should not observe $raw size mutations', () => {
    let dummy
    const set = observable(new Set())
    const reaction = observe(() => (dummy = set.$raw.size))

    expect(dummy).to.equal(0)
    set.add('value')
    expect(dummy).to.equal(0)
  })

  it('should not be triggered by $raw size mutations', () => {
    let dummy
    const set = observable(new Set())
    const reaction = observe(() => (dummy = set.size))

    expect(dummy).to.equal(0)
    set.$raw.add('value')
    expect(dummy).to.equal(0)
  })
})
