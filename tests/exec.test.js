import { expect } from 'chai'
import { observe, exec, observable, nextTick } from '../src'

describe('exec', () => {
  it('should track the newly discovered function parts', async () => {
    let condition = false
    let dummy

    const counter = observable({ condition: false, num: 0 })
    const observer = observe(conditionalIncrement)

    function conditionalIncrement () {
      if (condition) {
        dummy = counter.num
      }
    }

    await nextTick()
    expect(dummy).to.equal(undefined)
    counter.num++
    await nextTick()
    expect(dummy).to.equal(undefined)
    condition = true
    exec(observer)
    await nextTick()
    expect(dummy).to.equal(1)
    counter.num++
    await nextTick()
    expect(dummy).to.equal(2)
  })
})
