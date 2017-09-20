import { expect } from 'chai'
import { observable, observe, nextTick } from '@nx-js/observer-util'

describe('nextTick', () => {
  it('should run the passed callback after the reactions run', async () => {
    let dummy

    const counter = observable({ num: 0 })
    observe(() => (dummy = counter.num))

    await nextTick()
    counter.num = 2
    expect(dummy).to.equal(0)
    nextTick(() => expect(dummy).to.equal(2))
  })

  it('should return a Promise, which resolves after the reactions run', async () => {
    let dummy

    const counter = observable({ num: 0 })
    observe(() => (dummy = counter.num))

    await nextTick()
    counter.num = 2
    expect(dummy).to.equal(0)
    await nextTick()
    expect(dummy).to.equal(2)
  })
})
