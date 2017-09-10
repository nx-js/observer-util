import { expect } from 'chai'
import { observable, isObservable } from '@nx-js/observer-util'

describe('Date', () => {
  it('should not be converted to observable', () => {
    const regex = new RegExp()
    const obsRegex = observable(regex)
    expect(obsRegex).to.equal(regex)
    expect(isObservable(obsRegex)).to.equal(false)
  })
})
