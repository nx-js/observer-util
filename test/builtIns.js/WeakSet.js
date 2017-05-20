require('reify')

const expect = require('chai').expect
const observer = require('../../src/observer')

describe('WeakSet', () => {
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
})
