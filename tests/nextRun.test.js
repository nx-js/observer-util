import { expect } from 'chai'
import { observable, observe, nextRun, priorities } from '@nx-js/observer-util'

for (let key in priorities) {
  const priority = priorities[key]

  describe(`nextRun with ${key} priority`, () => {
    it('should return a Promise, which resolves after the passed reaction runs', async () => {
      let dummy

      const counter = observable({ num: 0 })
      const reaction = observe(() => (dummy = counter.num), priority)

      await nextRun(reaction)
      counter.num = 2
      expect(dummy).to.equal(0)
      await nextRun(reaction)
      expect(dummy).to.equal(2)
    })

    it('should resolve immediately if the reaction is not queued', async () => {
      let dummy

      const counter = observable({ num: 0 })
      const reaction = observe(() => (dummy = counter.num), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should return the same Promise for multiple calls before the next run', async () => {
      let dummy

      const counter = observable({ num: 0 })
      const reaction = observe(() => (dummy = counter.num), priority)

      await nextRun(reaction)
      counter.num++
      await nextRun(reaction)
      await nextRun(reaction)
      expect(dummy).to.equal(1)
    })
  })
}
