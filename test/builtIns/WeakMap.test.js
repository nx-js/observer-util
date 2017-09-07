import { expect } from 'chai'
import { observable, observe, nextTick } from '../../src'

describe('WeakMap', () => {
  it('should be a proper JS WeakMap', () => {
    const map = observable(new WeakMap())
    expect(map).to.be.instanceOf(WeakMap)
    expect(map.$raw).to.be.instanceOf(WeakMap)
  })

  it('should observe mutations', () => {
    let dummy
    const key = {}
    const map = observable(new WeakMap())
    observe(() => dummy = map.get(key))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.set(key, 'value'))
      .then(() => expect(dummy).to.equal('value'))
      .then(() => map.delete(key))
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should observe custom property mutations', () => {
    let dummy
    const map = observable(new WeakMap())
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
    const key = {}
    const map = observable(new WeakMap())
    observe(() => {
      numOfRuns++
      dummy = map.get(key)
    })

    return Promise.resolve()
      .then(() => {
        expect(dummy).to.equal(undefined)
        expect(numOfRuns).to.equal(1)
      })
      .then(() => map.set(key, 'value'))
      .then(() => map.set(key, 'value'))
      .then(() => {
        expect(dummy).to.equal('value')
        expect(numOfRuns).to.equal(2)
      })
      .then(() => map.delete(key))
      .then(() => map.delete(key))
      .then(() => {
        expect(dummy).to.equal(undefined)
        expect(numOfRuns).to.equal(3)
      })
  })

  it('should not observe $raw mutations', () => {
    const key = {}
    let dummy
    const map = observable(new WeakMap())
    observe(() => dummy = map.$raw.get(key))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.set(key, 'Hello'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.delete('key'))
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not be triggered by $raw mutations', () => {
    const key = {}
    let dummy
    const map = observable(new WeakMap())
    observe(() => dummy = map.get(key))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.$raw.set(key, 'Hello'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => map.$raw.delete('key'))
      .then(() => expect(dummy).to.equal(undefined))
  })
})
