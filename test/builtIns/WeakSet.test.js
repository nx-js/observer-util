import { expect } from 'chai'
import { observable, observe, nextTick } from '../../src'

describe('WeakSet', () => {
  it('should be a proper JS WeakSet', () => {
    const set = observable(new WeakSet())
    expect(set).to.be.instanceOf(WeakSet)
    expect(set.$raw).to.be.instanceOf(WeakSet)
  })

  it('should observe mutations', () => {
    let dummy
    const value = {}
    const set = observable(new WeakSet())
    observe(() => dummy = set.has(value))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.add(value))
      .then(() => expect(dummy).to.equal(true))
      .then(() => set.delete(value))
      .then(() => expect(dummy).to.equal(false))
  })

  it('should observe custom property mutations', () => {
    let dummy
    const set = observable(new WeakSet())
    observe(() => dummy = set.customProp)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => set.customProp = 'Hello World')
      .then(() => expect(dummy).to.equal('Hello World'))
      .then(() => delete set.customProp)
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not observe non value changing mutations', () => {
    let dummy
    const value = {}
    let numOfRuns = 0
    const set = observable(new WeakSet())
    observe(() => {
      numOfRuns++
      dummy = set.has(value)
    })

    return Promise.resolve()
      .then(() => {
        expect(dummy).to.equal(false)
        expect(numOfRuns).to.equal(1)
      })
      .then(() => set.add(value))
      .then(() => set.add(value))
      .then(() => {
        expect(dummy).to.equal(true)
        expect(numOfRuns).to.equal(2)
      })
      .then(() => set.delete(value))
      .then(() => set.delete(value))
      .then(() => {
        expect(dummy).to.equal(false)
        expect(numOfRuns).to.equal(3)
      })
  })

  it('should not observe $raw mutations', () => {
    const value = {}
    let dummy
    const set = observable(new WeakSet())
    observe(() => dummy = set.$raw.has(value))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.add(value))
      .then(() => expect(dummy).to.equal(false))
  })

  it('should not be triggered by $raw mutations', () => {
    const value = {}
    let dummy
    const set = observable(new WeakSet())
    observe(() => dummy = set.has(value))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => set.$raw.add(value))
      .then(() => expect(dummy).to.equal(false))
  })
})
