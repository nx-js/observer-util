require('reify')

const expect = require('chai').expect
const observer = require('../src')

describe('exec', () => {
  it('should track the newly discovered function parts', () => {
    let condition = false
    let counter

    const observable = observer.observable({condition: false, counter: 0})
    const signal = observer.observe(conditionalIncrement)

    function conditionalIncrement () {
      if (condition) {
        counter = observable.counter
      }
    }

    return Promise.resolve()
      .then(() => expect(counter).to.be.undefined)
      .then(() => observable.counter++)
      .then(() => expect(counter).to.be.undefined)
      .then(() => {
        condition = true
        observer.exec(signal)
      })
      .then(() => expect(counter).to.equal(1))
      .then(() => observable.counter++)
      .then(() => expect(counter).to.equal(2))
  })
})
