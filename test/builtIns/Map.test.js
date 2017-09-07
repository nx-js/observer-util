import { expect } from 'chai'
import { observable, observe, nextTick } from '../../src'

describe('Map', () => {
  it('should be a proper JS Map', () => {
    const map = observable(new Map())
    expect(map).to.be.instanceOf(Map)
    expect(map.$raw).to.be.instanceOf(Map)
  })

  it('should observe mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => dummy = map.get('key'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.set('key', 'value'))
      .then(() => expect(dummy).to.equal('value'))
      .then(() => map.delete('key'))
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should observe size mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => dummy = map.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => map.set('key', 'value'))
      .then(() => expect(dummy).to.equal(1))
      .then(() => map.delete('key'))
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe for of iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      for (let [key, num] of map) {
        dummy += num
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => map.set('key0', 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => map.set('key1', 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => map.delete('key0'))
      .then(() => expect(dummy).to.equal(2))
      .then(() => map.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe forEach iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      map.forEach(num => dummy += num)
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => map.set('key0', 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => map.set('key1', 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => map.delete('key0'))
      .then(() => expect(dummy).to.equal(2))
      .then(() => map.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe keys iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      for (let key of map.keys()) {
        dummy += key
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => map.set(3, 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => map.set(2, 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => map.delete(3))
      .then(() => expect(dummy).to.equal(2))
      .then(() => map.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe values iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      for (let num of map.values()) {
        dummy += num
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => map.set('key0', 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => map.set('key1', 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => map.delete('key0'))
      .then(() => expect(dummy).to.equal(2))
      .then(() => map.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe entries iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      for (let [key, num] of map.entries()) {
        dummy += num
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => map.set('key0', 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => map.set('key1', 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => map.delete('key0'))
      .then(() => expect(dummy).to.equal(2))
      .then(() => map.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe custom property mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => dummy = map.customProp)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.customProp = 'Hello World')
      .then(() => expect(dummy).to.equal('Hello World'))
      .then(() => delete map.customProp)
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not observe non value changing mutations', () => {
    let dummy
    let numOfRuns = 0
    const map = observable(new Map())
    observe(() => {
      numOfRuns++
      dummy = map.get('key')
    })

    return Promise.resolve()
      .then(() => {
        expect(dummy).to.equal(undefined)
        expect(numOfRuns).to.equal(1)
      })
      .then(() => map.set('key', 'value'))
      .then(() => map.set('key', 'value'))
      .then(() => {
        expect(dummy).to.equal('value')
        expect(numOfRuns).to.equal(2)
      })
      .then(() => map.delete('key'))
      .then(() => map.delete('key'))
      .then(() => {
        expect(dummy).to.equal(undefined)
        expect(numOfRuns).to.equal(3)
      })
  })

  it('should not observe $raw mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => dummy = map.$raw.get('key'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.set('key', 'value'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.delete('key'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.clear())
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not be triggered by $raw mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => dummy = map.get('key'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.$raw.set('key', 'value'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.$raw.delete('key'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.$raw.clear())
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not observe $raw size mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => dummy = map.$raw.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => map.set('key', 'value'))
      .then(() => expect(dummy).to.equal(0))
  })

  it('should not be triggered by $raw size mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => dummy = map.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => map.$raw.set('key', 'value'))
      .then(() => expect(dummy).to.equal(0))
  })
})
