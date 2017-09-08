import { expect } from 'chai'
import { spy } from './utils'
import { observable, observe, unqueue, nextTick } from '../src'

describe('unqueue', () => {
  it('should remove the observed function from the queue', async () => {
    let dummy
    const counter = observable({ num: 0 })
    const counterSpy = spy(() => (dummy = counter.num))
    const observer = observe(counterSpy)
    expect(counterSpy.callCount).to.equal(1)

    await nextTick()
    counter.num = 2
    unqueue(observer)
    await nextTick()
    expect(dummy).to.equal(0)
    expect(counterSpy.callCount).to.equal(1)
  })
})
