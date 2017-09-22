import { expect } from 'chai'
import { observe, observable, nextRun, priorities } from '@nx-js/observer-util'

for (let key in priorities) {
  const priority = priorities[key]

  describe(`env with ${key} priority`, () => {
    const rAF = requestAnimationFrame

    before(() => {
      window.requestAnimationFrame = undefined
    })

    after(() => {
      window.requestAnimationFrame = rAF
    })

    it('should observe basic properties in node', async () => {
      let dummy
      const counter = observable({ num: 0 })
      const reaction = observe(() => (dummy = counter.num), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      counter.num = 7
      await nextRun(reaction)
      expect(dummy).to.equal(7)
    })
  })
}
