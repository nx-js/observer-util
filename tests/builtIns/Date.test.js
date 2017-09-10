import { expect } from 'chai'
import { observable, isObservable } from '@nx-js/observer-util'

describe('Date', () => {
  it('should not be converted to observable', () => {
    const date = new Date()
    const obsDate = observable(date)
    expect(obsDate).to.equal(date)
    expect(isObservable(obsDate)).to.equal(false)
  })
})
