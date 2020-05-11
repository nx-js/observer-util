import { observe, observable } from '@nx-js/observer-util'

describe('debugger', () => {
  test('should debug get operations', () => {
    let dummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = jest.fn()
    observe(() => (dummy = counter.num), {
      debugger: debugSpy
    })

    expect(dummy).toBe(0)
    expect(debugSpy).toHaveBeenCalledTimes(1)
    expect(debugSpy).toHaveBeenCalledWith({
      type: 'get',
      target: rawCounter,
      key: 'num',
      receiver: counter
    })
  })

  test('should debug has operations', () => {
    let dummy
    const rawCounter = {}
    const counter = observable(rawCounter)
    const debugSpy = jest.fn()
    observe(() => (dummy = 'num' in counter), {
      debugger: debugSpy
    })

    expect(dummy).toBe(false)
    expect(debugSpy).toHaveBeenCalledTimes(1)
    expect(debugSpy).toHaveBeenCalledWith({
      type: 'has',
      target: rawCounter,
      key: 'num'
    })
  })

  test('should debug iteration operations', () => {
    let dummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = jest.fn()
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

    expect(dummy).toBe('num')
    expect(debugSpy).toHaveBeenCalledTimes(1)
    expect(debugSpy).toHaveBeenCalledWith({
      type: 'iterate',
      target: rawCounter
    })
  })

  test('should debug add operations', () => {
    let dummy
    const rawCounter = {}
    const counter = observable(rawCounter)
    const debugSpy = jest.fn()
    observe(() => (dummy = counter.num), {
      debugger: debugSpy
    })

    expect(dummy).toBe(undefined)
    expect(debugSpy).toHaveBeenCalledTimes(1)
    debugSpy.mockClear()

    counter.num = 12
    expect(dummy).toBe(12)
    // called once for the add operation and once for the get operation in the tirggered reaction
    expect(debugSpy).toHaveBeenCalledTimes(2)
    expect(debugSpy).toHaveBeenCalledWith({
      type: 'add',
      target: rawCounter,
      key: 'num',
      value: 12,
      receiver: counter
    })
  })

  test('should debug set operations', () => {
    let dummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = jest.fn()
    observe(() => (dummy = counter.num), {
      debugger: debugSpy
    })

    expect(dummy).toBe(0)
    expect(debugSpy).toHaveBeenCalledTimes(1)
    debugSpy.mockClear()

    counter.num = 12
    expect(dummy).toBe(12)
    // called once for the add operation and once for the get operation in the tirggered reaction
    expect(debugSpy).toHaveBeenCalledTimes(2)
    expect(debugSpy).toHaveBeenCalledWith({
      type: 'set',
      target: rawCounter,
      key: 'num',
      value: 12,
      oldValue: 0,
      receiver: counter
    })
  })

  test('should debug delete operations', () => {
    let dummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = jest.fn()
    observe(() => (dummy = counter.num), {
      debugger: debugSpy
    })

    expect(dummy).toBe(0)
    expect(debugSpy).toHaveBeenCalledTimes(1)
    debugSpy.mockClear()

    delete counter.num
    expect(dummy).toBe(undefined)
    // called once for the add operation and once for the get operation in the tirggered reaction
    expect(debugSpy).toHaveBeenCalledTimes(2)
    expect(debugSpy).toHaveBeenCalledWith({
      type: 'delete',
      target: rawCounter,
      key: 'num',
      oldValue: 0
    })
  })

  test('should debug clear operations', () => {
    let dummy
    const rawMap = new Map()
    rawMap.set('key', 'value')
    const map = observable(rawMap)
    const debugSpy = jest.fn()
    observe(() => (dummy = map.get('key')), {
      debugger: debugSpy
    })

    expect(dummy).toBe('value')
    expect(debugSpy).toHaveBeenCalledTimes(1)
    const oldMap = new Map(rawMap)
    debugSpy.mockClear()

    map.clear()
    expect(dummy).toBe(undefined)
    // called once for the add operation and once for the get operation in the tirggered reaction
    expect(debugSpy).toHaveBeenCalledTimes(2)
    expect(debugSpy).toHaveBeenCalledWith({
      type: 'clear',
      target: rawMap,
      oldTarget: oldMap
    })
  })

  test('should not cause infinite loops', () => {
    let receiverDummy
    const rawCounter = { num: 0 }
    const counter = observable(rawCounter)
    const debugSpy = jest.fn(({ receiver }) => (receiverDummy = receiver.num))
    observe(() => counter.num, {
      debugger: debugSpy
    })

    expect(receiverDummy).toBe(0)
    expect(debugSpy).toHaveBeenCalledTimes(1)
  })
})
