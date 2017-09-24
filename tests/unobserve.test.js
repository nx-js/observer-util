import { expect } from 'chai'
import { spy } from './utils'
import {
  observable,
  observe,
  unobserve,
  nextRun,
  priorities
} from '@nx-js/observer-util'

for (let key in priorities) {
  const priority = priorities[key]

  describe(`unobserve with ${key} priority`, () => {
    it('should unobserve the observed function', async () => {
      let dummy
      const counter = observable({ num: 0 })
      const counterSpy = spy(() => (dummy = counter.num))
      const reaction = observe(counterSpy, priority)

      await nextRun(reaction)
      expect(counterSpy.callCount).to.equal(1)
      counter.num = 'Hello'
      await nextRun(reaction)
      expect(counterSpy.callCount).to.equal(2)
      expect(dummy).to.equal('Hello')
      unobserve(reaction)
      counter.num = 'World'
      await nextRun(reaction)
      expect(counterSpy.callCount).to.equal(2)
      expect(dummy).to.equal('Hello')
    })

    it('should unobserve when the same key is used multiple times', async () => {
      let dummy
      const user = observable({ name: { name: 'Bob' } })
      const nameSpy = spy(() => (dummy = user.name.name))
      const reaction = observe(nameSpy, priority)

      await nextRun(reaction)
      expect(nameSpy.callCount).to.equal(1)
      user.name.name = 'Dave'
      await nextRun(reaction)
      expect(nameSpy.callCount).to.equal(2)
      expect(dummy).to.equal('Dave')
      unobserve(reaction)
      user.name.name = 'Ann'
      await nextRun(reaction)
      expect(nameSpy.callCount).to.equal(2)
      expect(dummy).to.equal('Dave')
    })

    it('should unobserve multiple reactions for the same target and key', async () => {
      let dummy
      const counter = observable({ num: 0 })

      const reaction1 = observe(() => (dummy = counter.num), priority)
      const reaction2 = observe(() => (dummy = counter.num), priority)
      const reaction3 = observe(() => (dummy = counter.num), priority)

      await Promise.all([
        nextRun(reaction1),
        nextRun(reaction2),
        nextRun(reaction3)
      ])
      expect(dummy).to.equal(0)
      unobserve(reaction1)
      unobserve(reaction2)
      unobserve(reaction3)
      counter.num++
      await Promise.all([
        nextRun(reaction1),
        nextRun(reaction2),
        nextRun(reaction3)
      ])
      expect(dummy).to.equal(0)
    })

    it('should unobserve even if the function is registered for the stack', async () => {
      let dummy
      const counter = observable({ num: 0 })
      const counterSpy = spy(() => (dummy = counter.num))
      const reaction = observe(counterSpy, priority)

      await nextRun(reaction)
      expect(counterSpy.callCount).to.equal(1)
      counter.num = 'Hello'
      await nextRun(reaction)
      expect(dummy).to.equal('Hello')
      expect(counterSpy.callCount).to.equal(2)
      counter.num = 'World'
      unobserve(reaction)
      await nextRun(reaction)
      expect(dummy).to.equal('Hello')
      expect(counterSpy.callCount).to.equal(2)
    })
  })
}
