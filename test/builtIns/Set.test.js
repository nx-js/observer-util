import { expect } from 'chai'
import { observable, observe, nextTick } from '../../src'

describe('Set', () => {
  it('should be a proper JS Set', () => {
    const set = observable(new Set())
    expect(set).to.be.instanceOf(Set)
    expect(set.$raw).to.be.instanceOf(Set)
  })

  it('should observe mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => dummy = set.has('value'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.add('value'))
      .then(() => expect(dummy).to.equal(true))
      .then(() => set.delete('value'))
      .then(() => expect(dummy).to.equal(false))
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

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => set.add(3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.add(2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => set.delete(2))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe forEach iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      set.forEach(num => dummy += num)
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => set.add(3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.add(2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => set.delete(2))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.clear())
      .then(() => expect(dummy).to.equal(0))
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

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => set.add(3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.add(2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => set.delete(2))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.clear())
      .then(() => expect(dummy).to.equal(0))
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

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => set.add(3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.add(2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => set.delete(2))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe entries iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (let [key, num] of set.entries()) {
        dummy += num
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => set.add(3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.add(2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => set.delete(2))
      .then(() => expect(dummy).to.equal(3))
      .then(() => set.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe custom property mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => dummy = set.customProp)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => set.customProp = 'Hello World')
      .then(() => expect(dummy).to.equal('Hello World'))
      .then(() => delete set.customProp)
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should observe size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => dummy = set.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => set.add('value'))
      .then(() => expect(dummy).to.equal(1))
      .then(() => set.delete('value'))
      .then(() => expect(dummy).to.equal(0))
  })

  it('should not observe non value changing mutations', () => {
    let dummy
    let numOfRuns = 0
    const set = observable(new Set())
    observe(() => {
      numOfRuns++
      dummy = set.has('value')
    })

    return Promise.resolve()
      .then(() => {
        expect(dummy).to.equal(false)
        expect(numOfRuns).to.equal(1)
      })
      .then(() => set.add('value'))
      .then(() => set.add('value'))
      .then(() => {
        expect(dummy).to.equal(true)
        expect(numOfRuns).to.equal(2)
      })
      .then(() => set.delete('value'))
      .then(() => set.delete('value'))
      .then(() => {
        expect(dummy).to.equal(false)
        expect(numOfRuns).to.equal(3)
      })
  })

  it('should not observe $raw mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => dummy = set.$raw.has('value'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.add('value'))
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.delete('key'))
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.clear())
      .then(() => expect(dummy).to.equal(false))
  })

  it('should not be triggered by $raw mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => dummy = set.has('value'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.$raw.add('value'))
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.$raw.delete('key'))
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.$raw.clear())
      .then(() => expect(dummy).to.equal(false))
  })

  it('should not observe $raw size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => dummy = set.$raw.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => set.add('value'))
      .then(() => expect(dummy).to.equal(0))
  })

  it('should not be triggered by $raw size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => dummy = set.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => set.$raw.add('value'))
      .then(() => expect(dummy).to.equal(0))
  })
})
