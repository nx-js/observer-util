import { expect } from 'chai'
import { observable, observe, nextTick } from '@nx-js/observer-util'
import { spy } from '../utils'

describe('Set', () => {
  it('should be a proper JS Set', () => {
    const set = observable(new Set())
    expect(set).to.be.instanceOf(Set)
    expect(set.$raw).to.be.instanceOf(Set)
  })

  it('should observe mutations', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.has('value')))

    await nextTick()
    expect(dummy).to.equal(false)
    set.add('value')
    await nextTick()
    expect(dummy).to.equal(true)
    set.delete('value')
    await nextTick()
    expect(dummy).to.equal(false)
  })

  it('should observe for of iteration', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (let num of set) {
        dummy += num
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    await nextTick()
    expect(dummy).to.equal(3)
    set.delete(2)
    await nextTick()
    expect(dummy).to.equal(1)
    set.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe forEach iteration', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      set.forEach(num => (dummy += num))
    })

    await nextTick()
    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    await nextTick()
    expect(dummy).to.equal(3)
    set.delete(2)
    await nextTick()
    expect(dummy).to.equal(1)
    set.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe values iteration', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (let num of set.values()) {
        dummy += num
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    await nextTick()
    expect(dummy).to.equal(3)
    set.delete(2)
    await nextTick()
    expect(dummy).to.equal(1)
    set.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe keys iteration', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (let num of set.keys()) {
        dummy += num
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    await nextTick()
    expect(dummy).to.equal(3)
    set.delete(2)
    await nextTick()
    expect(dummy).to.equal(1)
    set.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe entries iteration', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (let [key, num] of set.entries()) {
        dummy += num
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    set.add(2)
    set.add(1)
    await nextTick()
    expect(dummy).to.equal(3)
    set.delete(2)
    await nextTick()
    expect(dummy).to.equal(1)
    set.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe custom property mutations', async () => {
    let dummy
    const set = observable(new Set())
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

  it('should observe size mutations', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.size))

    await nextTick()
    expect(dummy).to.equal(0)
    set.add('value')
    set.add('value2')
    await nextTick()
    expect(dummy).to.equal(2)
    set.delete('value')
    await nextTick()
    expect(dummy).to.equal(1)
    set.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should not observe non value changing mutations', async () => {
    let dummy
    const set = observable(new Set())
    const setSpy = spy(() => (dummy = set.has('value')))
    observe(setSpy)

    await nextTick()
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(1)
    set.add('value')
    await nextTick()
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.add('value')
    await nextTick()
    expect(dummy).to.equal(true)
    expect(setSpy.callCount).to.equal(2)
    set.delete('value')
    await nextTick()
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
    set.delete('value')
    await nextTick()
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
    set.clear()
    await nextTick()
    expect(dummy).to.equal(false)
    expect(setSpy.callCount).to.equal(3)
  })

  it('should not observe $raw data', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.$raw.has('value')))

    await nextTick()
    expect(dummy).to.equal(false)
    set.add('value')
    await nextTick()
    expect(dummy).to.equal(false)
  })

  it('should not observe $raw iterations', async () => {
    let dummy = 0
    const set = observable(new Set())
    observe(() => {
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

    await nextTick()
    expect(dummy).to.equal(0)
    set.add(2)
    set.add(3)
    await nextTick()
    expect(dummy).to.equal(0)
    set.delete(2)
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should not be triggered by $raw mutations', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.has('value')))

    await nextTick()
    expect(dummy).to.equal(false)
    set.$raw.add('value')
    await nextTick()
    expect(dummy).to.equal(false)
    dummy = true
    set.$raw.delete('value')
    await nextTick()
    expect(dummy).to.equal(true)
    set.$raw.clear()
    await nextTick()
    expect(dummy).to.equal(true)
  })

  it('should not observe $raw size mutations', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.$raw.size))

    await nextTick()
    expect(dummy).to.equal(0)
    set.add('value')
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should not be triggered by $raw size mutations', async () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.size))

    await nextTick()
    expect(dummy).to.equal(0)
    set.$raw.add('value')
    await nextTick()
    expect(dummy).to.equal(0)
  })
})
