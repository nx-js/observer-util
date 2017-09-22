import { expect } from 'chai'
import { observable, observe, nextRun, priorities } from '@nx-js/observer-util'

describe('nextRun', () => {
  it('should return a Promise, which resolves after the passed reaction runs', async () => {
    let dummy

    const counter = observable({ num: 0 })
    const reaction = observe(() => (dummy = counter.num), priorities.CRITICAL)

    await nextRun(reaction)
    counter.num = 2
    expect(dummy).to.equal(0)
    await nextRun(reaction)
    expect(dummy).to.equal(2)
  })

  it('should resolve immediately if the reaction is not queued', async () => {
    let dummy

    const counter = observable({ num: 0 })
    const reaction = observe(() => (dummy = counter.num), priorities.HIGH)

    await nextRun(reaction)
    expect(dummy).to.equal(0)
    await nextRun(reaction)
    expect(dummy).to.equal(0)
  })

  it('should return the same Promise for multiple calls before the next run', async () => {
    let dummy

    const counter = observable({ num: 0 })
    const reaction = observe(() => (dummy = counter.num), priorities.LOW)

    await nextRun(reaction)
    counter.num++
    await nextRun(reaction)
    await nextRun(reaction)
    expect(dummy).to.equal(1)
  })
})