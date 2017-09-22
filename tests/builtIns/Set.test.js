import { expect } from 'chai'
import { observable, observe, nextRun, priorities } from '@nx-js/observer-util'
import { spy } from '../utils'

for (let key in priorities) {
  const priority = priorities[key]

  describe(`Set with ${key} priority`, () => {
    it('should be a proper JS Set', () => {
      const set = observable(new Set())
      expect(set).to.be.instanceOf(Set)
      expect(set.$raw).to.be.instanceOf(Set)
    })

    it('should observe mutations', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => (dummy = set.has('value')), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(false)
      set.add('value')
      await nextRun(reaction)
      expect(dummy).to.equal(true)
      set.delete('value')
      await nextRun(reaction)
      expect(dummy).to.equal(false)
    })

    it('should observe for of iteration', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => {
        dummy = 0
        for (let num of set) {
          dummy += num
        }
      }, priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.add(2)
      set.add(1)
      await nextRun(reaction)
      expect(dummy).to.equal(3)
      set.delete(2)
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      set.clear()
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should observe forEach iteration', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => {
        dummy = 0
        set.forEach(num => (dummy += num))
      }, priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.add(2)
      set.add(1)
      await nextRun(reaction)
      expect(dummy).to.equal(3)
      set.delete(2)
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      set.clear()
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should observe values iteration', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => {
        dummy = 0
        for (let num of set.values()) {
          dummy += num
        }
      }, priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.add(2)
      set.add(1)
      await nextRun(reaction)
      expect(dummy).to.equal(3)
      set.delete(2)
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      set.clear()
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should observe keys iteration', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => {
        dummy = 0
        for (let num of set.keys()) {
          dummy += num
        }
      }, priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.add(2)
      set.add(1)
      await nextRun(reaction)
      expect(dummy).to.equal(3)
      set.delete(2)
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      set.clear()
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should observe entries iteration', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => {
        dummy = 0
        // eslint-disable-next-line no-unused-vars
        for (let [key, num] of set.entries()) {
          dummy += num
        }
      }, priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.add(2)
      set.add(1)
      await nextRun(reaction)
      expect(dummy).to.equal(3)
      set.delete(2)
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      set.clear()
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should observe custom property mutations', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => (dummy = set.customProp), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(undefined)
      set.customProp = 'Hello World'
      await nextRun(reaction)
      expect(dummy).to.equal('Hello World')
      delete set.customProp
      await nextRun(reaction)
      expect(dummy).to.equal(undefined)
    })

    it('should observe size mutations', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => (dummy = set.size), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.add('value')
      set.add('value2')
      await nextRun(reaction)
      expect(dummy).to.equal(2)
      set.delete('value')
      await nextRun(reaction)
      expect(dummy).to.equal(1)
      set.clear()
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should not observe non value changing mutations', async () => {
      let dummy
      const set = observable(new Set())
      const setSpy = spy(() => (dummy = set.has('value')))
      const reaction = observe(setSpy, priority)

      await nextRun(reaction)
      expect(dummy).to.equal(false)
      expect(setSpy.callCount).to.equal(1)
      set.add('value')
      await nextRun(reaction)
      expect(dummy).to.equal(true)
      expect(setSpy.callCount).to.equal(2)
      set.add('value')
      await nextRun(reaction)
      expect(dummy).to.equal(true)
      expect(setSpy.callCount).to.equal(2)
      set.delete('value')
      await nextRun(reaction)
      expect(dummy).to.equal(false)
      expect(setSpy.callCount).to.equal(3)
      set.delete('value')
      await nextRun(reaction)
      expect(dummy).to.equal(false)
      expect(setSpy.callCount).to.equal(3)
      set.clear()
      await nextRun(reaction)
      expect(dummy).to.equal(false)
      expect(setSpy.callCount).to.equal(3)
    })

    it('should not observe $raw data', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => (dummy = set.$raw.has('value')), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(false)
      set.add('value')
      await nextRun(reaction)
      expect(dummy).to.equal(false)
    })

    it('should not observe $raw iterations', async () => {
      let dummy = 0
      const set = observable(new Set())
      const reaction = observe(() => {
        dummy = 0
        for (let [num] of set.$raw.entries()) {
          dummy += num
        }
        for (let num of set.$raw.keys()) {
          dummy += num
        }
        for (let num of set.$raw.values()) {
          dummy += num
        }
        set.$raw.forEach(num => {
          dummy += num
        })
        for (let num of set.$raw) {
          dummy += num
        }
      }, priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.add(2)
      set.add(3)
      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.delete(2)
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should not be triggered by $raw mutations', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => (dummy = set.has('value')), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(false)
      set.$raw.add('value')
      await nextRun(reaction)
      expect(dummy).to.equal(false)
      dummy = true
      set.$raw.delete('value')
      await nextRun(reaction)
      expect(dummy).to.equal(true)
      set.$raw.clear()
      await nextRun(reaction)
      expect(dummy).to.equal(true)
    })

    it('should not observe $raw size mutations', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => (dummy = set.$raw.size), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.add('value')
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })

    it('should not be triggered by $raw size mutations', async () => {
      let dummy
      const set = observable(new Set())
      const reaction = observe(() => (dummy = set.size), priority)

      await nextRun(reaction)
      expect(dummy).to.equal(0)
      set.$raw.add('value')
      await nextRun(reaction)
      expect(dummy).to.equal(0)
    })
  })
}
