require('reify')

const expect = require('chai').expect
const observer = require('../../src')

describe('WeakMap', () => {
  it('should be a proper JS WeakMap', () => {
    const observable = observer.observable(new WeakMap())
    expect(observable).to.be.instanceOf(WeakMap)
    expect(observable.$raw).to.be.instanceOf(WeakMap)
  })

  it('should observe mutations', () => {
    let dummy
    const key = {}
    const observable = observer.observable(new WeakMap())
    observer.observe(() => dummy = observable.get(key))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.set(key, 'value'))
      .then(() => expect(dummy).to.equal('value'))
      .then(() => observable.delete(key))
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should observe custom property mutations', () => {
    let dummy
    const observable = observer.observable(new WeakMap())
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
    let numOfRuns = 0
    const key = {}
    const observable = observer.observable(new WeakMap())
    observer.observe(() => {
      numOfRuns++
      dummy = observable.get(key)
    })

    return Promise.resolve()
      .then(() => {
        expect(dummy).to.equal(undefined)
        expect(numOfRuns).to.equal(1)
      })
      .then(() => observable.set(key, 'value'))
      .then(() => observable.set(key, 'value'))
      .then(() => {
        expect(dummy).to.equal('value')
        expect(numOfRuns).to.equal(2)
      })
      .then(() => observable.delete(key))
      .then(() => observable.delete(key))
      .then(() => {
        expect(dummy).to.equal(undefined)
        expect(numOfRuns).to.equal(3)
      })
  })

  it('should not observe $raw mutations', () => {
    const key = {}
    let dummy
    const observable = observer.observable(new WeakMap())
    observer.observe(() => dummy = observable.$raw.get(key))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.set(key, 'Hello'))
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not be triggered by $raw mutations', () => {
    const key = {}
    let dummy
    const observable = observer.observable(new WeakMap())
    observer.observe(() => dummy = observable.get(key))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.$raw.set(key, 'Hello'))
      .then(() => expect(dummy).to.equal(undefined))
  })
})
