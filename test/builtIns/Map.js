require('reify')

const expect = require('chai').expect
const observer = require('../../src')

describe('Map', () => {
  it('should be a proper JS Map', () => {
    const observable = observer.observable(new Map())
    expect(observable).to.be.instanceOf(Map)
    expect(observable.$raw).to.be.instanceOf(Map)
  })

  it('should observe mutations', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => dummy = observable.get('key'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.set('key', 'value'))
      .then(() => expect(dummy).to.equal('value'))
      .then(() => observable.delete('key'))
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should observe size mutations', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => dummy = observable.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.set('key', 'value'))
      .then(() => expect(dummy).to.equal(1))
      .then(() => observable.delete('key'))
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe for of iteration', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => {
      dummy = 0
      for (let [key, num] of observable) {
        dummy += num
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.set('key0', 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => observable.set('key1', 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => observable.delete('key0'))
      .then(() => expect(dummy).to.equal(2))
      .then(() => observable.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe forEach iteration', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => {
      dummy = 0
      observable.forEach(num => dummy += num)
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.set('key0', 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => observable.set('key1', 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => observable.delete('key0'))
      .then(() => expect(dummy).to.equal(2))
      .then(() => observable.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe keys iteration', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => {
      dummy = 0
      for (let key of observable.keys()) {
        dummy += key
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.set(3, 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => observable.set(2, 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => observable.delete(3))
      .then(() => expect(dummy).to.equal(2))
      .then(() => observable.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe values iteration', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => {
      dummy = 0
      for (let num of observable.values()) {
        dummy += num
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.set('key0', 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => observable.set('key1', 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => observable.delete('key0'))
      .then(() => expect(dummy).to.equal(2))
      .then(() => observable.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe entries iteration', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => {
      dummy = 0
      for (let [key, num] of observable.entries()) {
        dummy += num
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.set('key0', 3))
      .then(() => expect(dummy).to.equal(3))
      .then(() => observable.set('key1', 2))
      .then(() => expect(dummy).to.equal(5))
      .then(() => observable.delete('key0'))
      .then(() => expect(dummy).to.equal(2))
      .then(() => observable.clear())
      .then(() => expect(dummy).to.equal(0))
  })

  it('should observe custom property mutations', () => {
    let dummy
    const observable = observer.observable(new Map())
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
    const observable = observer.observable(new Map())
    observer.observe(() => {
      numOfRuns++
      dummy = observable.get('key')
    })

    return Promise.resolve()
      .then(() => {
        expect(dummy).to.equal(undefined)
        expect(numOfRuns).to.equal(1)
      })
      .then(() => observable.set('key', 'value'))
      .then(() => observable.set('key', 'value'))
      .then(() => {
        expect(dummy).to.equal('value')
        expect(numOfRuns).to.equal(2)
      })
      .then(() => observable.delete('key'))
      .then(() => observable.delete('key'))
      .then(() => {
        expect(dummy).to.equal(undefined)
        expect(numOfRuns).to.equal(3)
      })
  })

  it('should not observe $raw mutations', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => dummy = observable.$raw.get('key'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.set('key', 'value'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.delete('key'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.clear())
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not be triggered by $raw mutations', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => dummy = observable.get('key'))

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.$raw.set('key', 'value'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.$raw.delete('key'))
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.$raw.clear())
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not observe $raw size mutations', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => dummy = observable.$raw.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.set('key', 'value'))
      .then(() => expect(dummy).to.equal(0))
  })

  it('should not be triggered by $raw size mutations', () => {
    let dummy
    const observable = observer.observable(new Map())
    observer.observe(() => dummy = observable.size)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.$raw.set('key', 'value'))
      .then(() => expect(dummy).to.equal(0))
  })
})
