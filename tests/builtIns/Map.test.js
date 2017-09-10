import { expect } from 'chai'
import { observable, observe, nextTick } from '@nx-js/observer-util'
import { spy } from '../utils'

describe('Map', () => {
  it('should be a proper JS Map', () => {
    const map = observable(new Map())
    expect(map).to.be.instanceOf(Map)
    expect(map.$raw).to.be.instanceOf(Map)
  })

  it('should observe mutations', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.get('key')))

    await nextTick()
    expect(dummy).to.equal(undefined)
    map.set('key', 'value')
    await nextTick()
    expect(dummy).to.equal('value')
    map.delete('key')
    await nextTick()
    expect(dummy).to.equal(undefined)
  })

  it('should observe size mutations', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.size))

    await nextTick()
    expect(dummy).to.equal(0)
    map.set('key1', 'value')
    map.set('key2', 'value2')
    await nextTick()
    expect(dummy).to.equal(2)
    map.delete('key1')
    await nextTick()
    expect(dummy).to.equal(1)
    map.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe for of iteration', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (let [key, num] of map) {
        dummy += num
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    map.set('key0', 3)
    await nextTick()
    expect(dummy).to.equal(3)
    map.set('key1', 2)
    await nextTick()
    expect(dummy).to.equal(5)
    map.delete('key0')
    await nextTick()
    expect(dummy).to.equal(2)
    map.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe forEach iteration', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      map.forEach(num => (dummy += num))
    })

    await nextTick()
    expect(dummy).to.equal(0)
    map.set('key0', 3)
    await nextTick()
    expect(dummy).to.equal(3)
    map.set('key1', 2)
    await nextTick()
    expect(dummy).to.equal(5)
    map.delete('key0')
    await nextTick()
    expect(dummy).to.equal(2)
    map.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe keys iteration', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      for (let key of map.keys()) {
        dummy += key
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    map.set(3, 3)
    await nextTick()
    expect(dummy).to.equal(3)
    map.set(2, 2)
    await nextTick()
    expect(dummy).to.equal(5)
    map.delete(3)
    await nextTick()
    expect(dummy).to.equal(2)
    map.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe values iteration', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      for (let num of map.values()) {
        dummy += num
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    map.set('key0', 3)
    await nextTick()
    expect(dummy).to.equal(3)
    map.set('key1', 2)
    await nextTick()
    expect(dummy).to.equal(5)
    map.delete('key0')
    await nextTick()
    expect(dummy).to.equal(2)
    map.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe entries iteration', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (let [key, num] of map.entries()) {
        dummy += num
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    map.set('key0', 3)
    await nextTick()
    expect(dummy).to.equal(3)
    map.set('key1', 2)
    await nextTick()
    expect(dummy).to.equal(5)
    map.delete('key0')
    await nextTick()
    expect(dummy).to.equal(2)
    map.clear()
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should observe custom property mutations', async () => {
    let dummy
    const map = observable(new Map())
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
    const map = observable(new Map())
    const mapSpy = spy(() => (dummy = map.get('key')))
    observe(mapSpy)

    await nextTick()
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(1)
    map.set('key', 'value')
    await nextTick()
    expect(dummy).to.equal('value')
    expect(mapSpy.callCount).to.equal(2)
    map.set('key', 'value')
    await nextTick()
    expect(dummy).to.equal('value')
    expect(mapSpy.callCount).to.equal(2)
    map.delete('key')
    await nextTick()
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(3)
    map.delete('key')
    await nextTick()
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(3)
    map.clear()
    await nextTick()
    expect(dummy).to.equal(undefined)
    expect(mapSpy.callCount).to.equal(3)
  })

  it('should not observe $raw data', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.$raw.get('key')))

    await nextTick()
    expect(dummy).to.equal(undefined)
    map.set('key', 'Hello')
    await nextTick()
    expect(dummy).to.equal(undefined)
    map.delete('key')
    await nextTick()
    expect(dummy).to.equal(undefined)
  })

  it('should not observe $raw iterations', async () => {
    let dummy = 0
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (let [key, num] of map.$raw.entries()) {
        dummy += num
      }
      for (let key of map.$raw.keys()) {
        dummy += map.$raw.get(key)
      }
      for (let num of map.$raw.values()) {
        dummy += num
      }
      map.$raw.forEach((num, key) => {
        dummy += num
      })
      // eslint-disable-next-line no-unused-vars
      for (let [key, num] of map.$raw) {
        dummy += num
      }
    })

    await nextTick()
    expect(dummy).to.equal(0)
    map.set('key1', 2)
    map.set('key2', 3)
    await nextTick()
    expect(dummy).to.equal(0)
    map.delete('key1')
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should not be triggered by $raw mutations', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.get('key')))

    await nextTick()
    expect(dummy).to.equal(undefined)
    map.$raw.set('key', 'Hello')
    await nextTick()
    expect(dummy).to.equal(undefined)
    dummy = 'Thing'
    map.$raw.delete('key')
    await nextTick()
    expect(dummy).to.equal('Thing')
    map.$raw.clear()
    await nextTick()
    expect(dummy).to.equal('Thing')
  })

  it('should not observe $raw size mutations', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.$raw.size))

    await nextTick()
    expect(dummy).to.equal(0)
    map.set('key', 'value')
    await nextTick()
    expect(dummy).to.equal(0)
  })

  it('should not be triggered by $raw size mutations', async () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.size))

    await nextTick()
    expect(dummy).to.equal(0)
    map.$raw.set('key', 'value')
    await nextTick()
    expect(dummy).to.equal(0)
  })
})
