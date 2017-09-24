import { expect } from 'chai'
import { spy, beforeNextFrame, heavyCalculation } from './utils'
import {
  observe,
  observable,
  nextRun,
  getPriority,
  setPriority,
  priorities
} from '@nx-js/observer-util'

describe('reaction priority', () => {
  describe('observe', () => {
    it('should throw on invalid priority', () => {
      expect(() => observe(() => {}, 'medium')).to.throw()
      expect(() => observe(() => {})).to.not.throw()
      expect(() => observe(() => {}), null).to.not.throw()
      expect(() => observe(() => {}), priorities.CRITICAL).to.not.throw()
      expect(() => observe(() => {}), priorities.HIGH).to.not.throw()
      expect(() => observe(() => {}), priorities.LOW).to.not.throw()
    })

    it('should run all critical tasks before the next frame', async () => {
      let runs = 0
      const counter = observable({ num: 0 })

      const reactions = []
      for (let i = 0; i < 10; i++) {
        reactions.push(
          observe(() => {
            const duration = heavyCalculation()
            const dummy = counter.num
            runs++
          }, priorities.CRITICAL)
        )
      }

      await beforeNextFrame()
      expect(runs).to.equal(10)
    })

    it('should run all critical tasks before high prio tasks before the low prio tasks', async () => {
      let criticalRuns = 0
      let highPrioRuns = 0
      let lowPrioRuns = 0
      const counter = observable({ num: 0 })

      const criticalReactions = []
      const highPrioReactions = []
      const lowPrioReactions = []
      for (let i = 0; i < 10; i++) {
        criticalReactions.push(
          observe(() => {
            const duration = heavyCalculation()
            const dummy = counter.num
            criticalRuns++
          }, priorities.CRITICAL)
        )

        highPrioReactions.push(
          observe(() => {
            const duration = heavyCalculation()
            const dummy = counter.num
            highPrioRuns++
          }, priorities.HIGH)
        )

        lowPrioReactions.push(
          observe(() => {
            const duration = heavyCalculation()
            const dummy = counter.num
            lowPrioRuns++
          }, priorities.LOW)
        )
      }

      await Promise.all(criticalReactions.map(nextRun))
      expect(criticalRuns).to.equal(10)
      expect(highPrioRuns).to.not.equal(10)
      expect(lowPrioRuns).to.equal(0)
      await Promise.all(highPrioReactions.map(nextRun))
      expect(criticalRuns).to.equal(10)
      expect(highPrioRuns).to.equal(10)
      expect(lowPrioRuns).to.not.equal(10)
      await Promise.all(lowPrioReactions.map(nextRun))
      expect(criticalRuns).to.equal(10)
      expect(highPrioRuns).to.equal(10)
      expect(lowPrioRuns).to.equal(10)
    })
  })

  describe('setPriority', () => {
    it('should throw when the first agument is not a reaction', () => {
      expect(() => setPriority(() => {}, priorities.CRITICAL)).to.throw()
      expect(() => setPriority(null, priorities.HIGH)).to.throw()
      expect(() => setPriority(undefined, priorities.LOW)).to.throw()
    })

    it('should throw on invalid priority', () => {
      const reaction = observe(() => {})
      expect(() => setPriority(reaction, null)).to.throw()
      expect(() => setPriority(reaction, 'medium')).to.throw()
      expect(() => setPriority(reaction)).to.throw()
      expect(() => setPriority(reaction, priorities.CRITICAL)).to.not.throw()
      expect(() => setPriority(reaction, priorities.HIGH)).to.not.throw()
      expect(() => setPriority(reaction, priorities.LOW)).to.not.throw()
    })

    it('should move reaction to the correct priority queue if it is already queued', async () => {
      let runs = 0
      const counter = observable({ num: 0 })

      const reactions = []
      for (let i = 0; i < 10; i++) {
        reactions.push(
          observe(() => {
            const duration = heavyCalculation()
            const dummy = counter.num
            runs++
          }, priorities.LOW)
        )
      }

      reactions.forEach(reaction => setPriority(reaction, priorities.CRITICAL))
      await beforeNextFrame()
      expect(runs).to.equal(10)
    })
  })

  describe('getPriority', () => {
    it('should throw when the first argument is not a reaction', () => {
      expect(() => getPriority(() => {})).to.throw()
      expect(() => getPriority(null)).to.throw()
      expect(() => getPriority(undefined)).to.throw()
    })

    it('should return the reaction priority', () => {
      const reaction = observe(() => {})

      expect(getPriority(reaction)).to.equal(priorities.CRITICAL)
      setPriority(reaction, priorities.HIGH)
      expect(getPriority(reaction)).to.equal(priorities.HIGH)
      setPriority(reaction, priorities.LOW)
      expect(getPriority(reaction)).to.equal(priorities.LOW)
    })
  })
})
