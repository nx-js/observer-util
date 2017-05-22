require('reify')

const expect = require('chai').expect
const observer = require('../../src')

describe('Date', () => {
  it('should not be converted to observable', () => {
    const date = new Date()
    const observable = observer.observable(date)
    expect(observable).to.equal(date)
    // expect(observer.isObservable(observable)).to.be.false
  })
})
