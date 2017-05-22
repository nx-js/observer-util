require('reify')

const expect = require('chai').expect
const observer = require('../src')

describe('unqueue', () => {
  it('should remove the observed function from the queue', () => {
    let dummy
    const observable = observer.observable({prop: 0})

    let numOfRuns = 0
    function test() {
      dummy = observable.prop
      numOfRuns++
    }
    const signal = observer.observe(test)

    return Promise.resolve()
      .then(() => {
        observable.prop = 2
        observer.unqueue(signal)
      })
      .then(() => expect(numOfRuns).to.equal(1))
  })
})
