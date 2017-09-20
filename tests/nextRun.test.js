import { expect } from 'chai'
import { observable, observe, nextRun } from '@nx-js/observer-util'

describe('nextRun', () => {
  it('should return a Promise, which resolves after the reactions run', async () => {
    let dummy

    const counter = observable({ num: 0 })
    const reaction = observe(() => (dummy = counter.num))

    await nextRun(reaction)
    counter.num = 2
    expect(dummy).to.equal(0)
    await nextRun(reaction)
    expect(dummy).to.equal(2)
  })
})
