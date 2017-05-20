require('reify')

const expect = require('chai').expect
const observer = require('../../src/observer')

describe('WeakMap', () => {
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
})
