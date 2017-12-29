import { expect } from 'chai'
import { observable, isObservable } from '@nx-js/observer-util'

describe('Node', () => {
  it('should not be converted to observable', () => {
    const node = document
    const obsNode = observable(node)
    expect(obsNode).to.equal(node)
    expect(isObservable(obsNode)).to.equal(false)
  })
})
