import { expect } from 'chai'
import {
  observe,
  queue,
  observable,
  nextRun,
  priorities
} from '@nx-js/observer-util'
import { spy } from './utils'

for (let key in priorities) {
  const priority = priorities[key]

  describe(`queue with ${key} priority`, () => {
    it('should add the reaction to the reaction queue', async () => {
      let dummy

      const counter = observable({ num: 0 })
      const counterSpy = spy(() => (dummy = counter.num))
      const reaction = observe(counterSpy, priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      expect(reaction.callCount).to.equal(1)
      counter.num++
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      expect(reaction.callCount).to.equal(2)
      queue(reaction)
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      expect(reaction.callCount).to.equal(3)
    })

    it('should track the newly discovered function parts', async () => {
      let condition = false
      let dummy

      const counter = observable({ condition: false, num: 0 })
      const reaction = observe(conditionalIncrement, priority)

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
      queue(reaction)
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      counter.num++
      await nextRun(reaction)
      expect(dummy).to.equal(2)
    })
  })
}
