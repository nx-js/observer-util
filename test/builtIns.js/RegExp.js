require('reify')

const expect = require('chai').expect
const observer = require('../../src')

describe('Date', () => {
  it('should not be converted to observable', () => {
    const regex = new RegExp()
    const observable = observer.observable(regex)
    expect(observer.isObservable(observable)).to.be.false
  })
})
