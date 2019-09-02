import chai from 'chai'
const { expect } = chai
import { spy } from './utils'
import { observe, observable } from 'nemo-observer-util'

describe('debugger', () => {
  it('should debug get operations', () => {
    let dummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = spy(() => {})
    observe(() => (dummy = counter.num), {
      debugger: debugSpy
    })

    expect(dummy).to.equal(0)
    expect(debugSpy.callCount).to.equal(1)
    expect(debugSpy.lastArgs).to.eql([
      {
        type: 'get',
        target: rawCounter,
        key: 'num',
        receiver: counter
      }
    ])
  })

  it('should debug has operations', () => {
    let dummy
    const rawCounter = {}
    const counter = observable(rawCounter)
    const debugSpy = spy(() => {})
    observe(() => (dummy = 'num' in counter), {
      debugger: debugSpy
    })

    expect(dummy).to.equal(false)
    expect(debugSpy.callCount).to.equal(1)
    expect(debugSpy.lastArgs).to.eql([
      {
        type: 'has',
        target: rawCounter,
        key: 'num'
      }
    ])
  })

  it('should debug iteration operations', () => {
    let dummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = spy(() => {})
    observe(
      () => {
        for (const key in counter) {
          dummy = key
        }
      },
      {
        debugger: debugSpy
      }
    )

    expect(dummy).to.equal('num')
    expect(debugSpy.callCount).to.equal(1)
    expect(debugSpy.lastArgs).to.eql([
      {
        type: 'iterate',
        target: rawCounter
      }
    ])
  })

  it('should debug add operations', () => {
    let dummy
    const rawCounter = {}
    const counter = observable(rawCounter)
    const debugSpy = spy(() => {})
    observe(() => (dummy = counter.num), {
      debugger: debugSpy
    })

    expect(dummy).to.equal(undefined)
    expect(debugSpy.callCount).to.equal(1)
    counter.num = 12
    expect(dummy).to.equal(12)
    expect(debugSpy.callCount).to.equal(3)
    expect(debugSpy.args[1]).to.eql([
      {
        type: 'add',
        target: rawCounter,
        key: 'num',
        value: 12,
        receiver: counter
      }
    ])
  })

  it('should debug set operations', () => {
    let dummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = spy(() => {})
    observe(() => (dummy = counter.num), {
      debugger: debugSpy
    })

    expect(dummy).to.equal(0)
    expect(debugSpy.callCount).to.equal(1)
    counter.num = 12
    expect(dummy).to.equal(12)
    expect(debugSpy.callCount).to.equal(3)
    expect(debugSpy.args[1]).to.eql([
      {
        type: 'set',
        target: rawCounter,
        key: 'num',
        value: 12,
        oldValue: 0,
        receiver: counter
      }
    ])
  })

  it('should debug delete operations', () => {
    let dummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = spy(() => {})
    observe(() => (dummy = counter.num), {
      debugger: debugSpy
    })

    expect(dummy).to.equal(0)
    expect(debugSpy.callCount).to.equal(1)
    delete counter.num
    expect(dummy).to.equal(undefined)
    expect(debugSpy.callCount).to.equal(3)
    expect(debugSpy.args[1]).to.eql([
      {
        type: 'delete',
        target: rawCounter,
        key: 'num',
        oldValue: 0
      }
    ])
  })

  it('should debug clear operations', () => {
    let dummy
    const rawMap = new Map()
    rawMap.set('key', 'value')
    const map = observable(rawMap)
    const debugSpy = spy(() => {})
    observe(() => (dummy = map.get('key')), {
      debugger: debugSpy
    })

    expect(dummy).to.equal('value')
    expect(debugSpy.callCount).to.equal(1)
    const oldMap = new Map(rawMap)
    map.clear()
    expect(dummy).to.equal(undefined)
    expect(debugSpy.callCount).to.equal(3)
    expect(debugSpy.args[1]).to.eql([
      {
        type: 'clear',
        target: rawMap,
        oldTarget: oldMap
      }
    ])
  })

  it('should not cause infinite loops', () => {
    let receiverDummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = spy(({ receiver }) => (receiverDummy = receiver.num))
    observe(() => counter.num, {
      debugger: debugSpy
    })

    expect(receiverDummy).to.equal(0)
    expect(debugSpy.callCount).to.equal(1)
  })
})
