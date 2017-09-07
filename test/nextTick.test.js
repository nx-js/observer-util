import { expect } from 'chai'
import { observable, observe, nextTick } from '../src'

describe('nextTick', () => {
  it('should run the passed callback after the reactions run', () => {
    let dummy

    const counter = observable({ num: 0 })
    observe(() => dummy = counter.num)

    counter.num = 2
    expect(dummy).to.equal(0)
    nextTick(() => expect(dummy).to.equal(2))
  })

  it('should return a Promise, which resolves after the reactions run', async () => {
    let dummy

    const counter = observable({ num: 0 })
    observe(() => dummy = counter.num)

    counter.num = 2
    expect(dummy).to.equal(0)
    await nextTick()
    expect(dummy).to.equal(2)
  })

  it('should interact properly with MutationObservers', async () => {
    let counter = 0
    const textNode = document.createTextNode(String(counter))
    new MutationObserver(nextMutation).observe(textNode, {characterData: true})

    function nextMutation () {
      if (counter <= 20) {
        nextTick(() => textNode.textContent = counter++)
      }
    }

    // all reactions and DOM mutations should be handled before the next task
    setTimeout(() => expect(counter).to.equal(20))
  })
})
