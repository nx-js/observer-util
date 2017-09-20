import { expect } from 'chai'
import { observe, exec, observable, nextRun } from '@nx-js/observer-util'

describe('exec', () => {
  it('should track the newly discovered function parts', async () => {
    let condition = false
    let dummy

    const counter = observable({ condition: false, num: 0 })
    const reaction = observe(conditionalIncrement)

    function conditionalIncrement () {
      if (condition) {
        dummy = counter.num
      }
    }

    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
    counter.num++
    await nextRun(reaction)
    expect(dummy).to.equal(undefined)
    condition = true
    exec(reaction)
    await nextRun(reaction)
    expect(dummy).to.equal(1)
    counter.num++
    await nextRun(reaction)
    expect(dummy).to.equal(2)
  })
})
