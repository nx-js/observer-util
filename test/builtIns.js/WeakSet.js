require('reify')

const expect = require('chai').expect
const observer = require('../../src')

describe('WeakSet', () => {
  it('should be a proper JS WeakSet', () => {
    const observable = observer.observable(new WeakSet())
    expect(observable).to.be.instanceOf(WeakSet)
    expect(observable.$raw).to.be.instanceOf(WeakSet)
  })

  it('should observe mutations', () => {
    let dummy
    const value = {}
    const observable = observer.observable(new WeakSet())
    observer.observe(() => dummy = observable.has(value))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => observable.add(value))
      .then(() => expect(dummy).to.equal(true))
      .then(() => observable.delete(value))
      .then(() => expect(dummy).to.equal(false))
  })

  it('should observe custom property mutations', () => {
    let dummy
    const observable = observer.observable(new WeakSet())
    observer.observe(() => dummy = observable.customProp)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.customProp = 'Hello World')
      .then(() => expect(dummy).to.equal('Hello World'))
      .then(() => delete observable.customProp)
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not observe non value changing mutations', () => {
    let dummy
    const value = {}
    let numOfRuns = 0
    const observable = observer.observable(new WeakSet())
    observer.observe(() => {
      numOfRuns++
      dummy = observable.has(value)
    })

    return Promise.resolve()
      .then(() => {
        expect(dummy).to.equal(false)
        expect(numOfRuns).to.equal(1)
      })
      .then(() => observable.add(value))
      .then(() => observable.add(value))
      .then(() => {
        expect(dummy).to.equal(true)
        expect(numOfRuns).to.equal(2)
      })
      .then(() => observable.delete(value))
      .then(() => observable.delete(value))
      .then(() => {
        expect(dummy).to.equal(false)
        expect(numOfRuns).to.equal(3)
      })
  })

  it('should not observe $raw mutations', () => {
    const value = {}
    let dummy
    const observable = observer.observable(new WeakSet())
    observer.observe(() => dummy = observable.$raw.has(value))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => observable.add(value))
      .then(() => expect(dummy).to.equal(false))
  })

  it('should not be triggered by $raw mutations', () => {
    const value = {}
    let dummy
    const observable = observer.observable(new WeakSet())
    observer.observe(() => dummy = observable.has(value))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(false))
      .then(() => observable.$raw.add(value))
      .then(() => expect(dummy).to.equal(false))
  })
})
