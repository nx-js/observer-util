import { expect } from 'chai'
import { spy } from './utils'
import { observable, observe, unqueue, nextRun, priorities } from '@nx-js/observer-util'

for (let key in priorities) {
  const priority = priorities[key]

  describe(`unqueue with ${key} priority`, () => {
    it('should remove the observed function from the queue', async () => {
      let dummy
      const counter = observable({ num: 0 })
      const counterSpy = spy(() => (dummy = counter.num))
      const reaction = observe(counterSpy, priority)

      await nextRun(reaction)
      expect(counterSpy.callCount).to.equal(1)
      counter.num = 2
      unqueue(reaction)
      await nextRun(reaction)
      expect(dummy).to.equal(0)
      expect(counterSpy.callCount).to.equal(1)
    })
  })
}
