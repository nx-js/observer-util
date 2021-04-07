/* eslint no-unused-expressions: 0, no-unused-vars: 0 */

import { observable, isObservable, observe, raw } from '@nx-js/observer-util'

describe('Set', () => {
  test('should be a proper JS Set', () => {
    const set = observable(new Set())
    expect(set).toBeInstanceOf(Set)
    expect(raw(set)).toBeInstanceOf(Set)
  })

  test('should observe mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.has('value')))

    expect(dummy).toBe(false)
    set.add('value')
    expect(dummy).toBe(true)
    set.delete('value')
    expect(dummy).toBe(false)
  })

  test('should observe for of iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (const num of set) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    set.add(2)
    set.add(1)
    expect(dummy).toBe(3)
    set.delete(2)
    expect(dummy).toBe(1)
    set.clear()
    expect(dummy).toBe(0)
  })

  test('should observe forEach iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      set.forEach((num) => (dummy += num))
    })

    expect(dummy).toBe(0)
    set.add(2)
    set.add(1)
    expect(dummy).toBe(3)
    set.delete(2)
    expect(dummy).toBe(1)
    set.clear()
    expect(dummy).toBe(0)
  })

  test('should observe values iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (const num of set.values()) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    set.add(2)
    set.add(1)
    expect(dummy).toBe(3)
    set.delete(2)
    expect(dummy).toBe(1)
    set.clear()
    expect(dummy).toBe(0)
  })

  test('should observe keys iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (const num of set.keys()) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    set.add(2)
    set.add(1)
    expect(dummy).toBe(3)
    set.delete(2)
    expect(dummy).toBe(1)
    set.clear()
    expect(dummy).toBe(0)
  })

  test('should observe entries iteration', () => {
    let dummy
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (const [key, num] of set.entries()) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    set.add(2)
    set.add(1)
    expect(dummy).toBe(3)
    set.delete(2)
    expect(dummy).toBe(1)
    set.clear()
    expect(dummy).toBe(0)
  })

  test('should be triggered by clearing', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.has('key')))

    expect(dummy).toBe(false)
    set.add('key')
    expect(dummy).toBe(true)
    set.clear()
    expect(dummy).toBe(false)
  })

  test('should not observe custom property mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.customProp))

    expect(dummy).toBe(undefined)
    set.customProp = 'Hello World'
    expect(dummy).toBe(undefined)
  })

  test('should observe size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.size))

    expect(dummy).toBe(0)
    set.add('value')
    set.add('value2')
    expect(dummy).toBe(2)
    set.delete('value')
    expect(dummy).toBe(1)
    set.clear()
    expect(dummy).toBe(0)
  })

  test('should not observe non value changing mutations', () => {
    let dummy
    const set = observable(new Set())
    const setSpy = jest.fn(() => (dummy = set.has('value')))
    observe(setSpy)

    expect(dummy).toBe(false)
    expect(setSpy).toHaveBeenCalledTimes(1)
    set.add('value')
    expect(dummy).toBe(true)
    expect(setSpy).toHaveBeenCalledTimes(2)
    set.add('value')
    expect(dummy).toBe(true)
    expect(setSpy).toHaveBeenCalledTimes(2)
    set.delete('value')
    expect(dummy).toBe(false)
    expect(setSpy).toHaveBeenCalledTimes(3)
    set.delete('value')
    expect(dummy).toBe(false)
    expect(setSpy).toHaveBeenCalledTimes(3)
    set.clear()
    expect(dummy).toBe(false)
    expect(setSpy).toHaveBeenCalledTimes(3)
  })

  test('should not observe raw data', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = raw(set).has('value')))

    expect(dummy).toBe(false)
    set.add('value')
    expect(dummy).toBe(false)
  })

  test('should not observe raw iterations', () => {
    let dummy = 0
    const set = observable(new Set())
    observe(() => {
      dummy = 0
      for (const [num] of raw(set).entries()) {
        dummy += num
      }
      for (const num of raw(set).keys()) {
        dummy += num
      }
      for (const num of raw(set).values()) {
        dummy += num
      }
      raw(set).forEach((num) => {
        dummy += num
      })
      for (const num of raw(set)) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    set.add(2)
    set.add(3)
    expect(dummy).toBe(0)
    set.delete(2)
    expect(dummy).toBe(0)
  })

  test('should not be triggered by raw mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.has('value')))

    expect(dummy).toBe(false)
    raw(set).add('value')
    expect(dummy).toBe(false)
    dummy = true
    raw(set).delete('value')
    expect(dummy).toBe(true)
    raw(set).clear()
    expect(dummy).toBe(true)
  })

  test('should not observe raw size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = raw(set).size))

    expect(dummy).toBe(0)
    set.add('value')
    expect(dummy).toBe(0)
  })

  test('should not be triggered by raw size mutations', () => {
    let dummy
    const set = observable(new Set())
    observe(() => (dummy = set.size))

    expect(dummy).toBe(0)
    raw(set).add('value')
    expect(dummy).toBe(0)
  })

  test('should support objects as key', () => {
    let dummy
    const key = {}
    const set = observable(new Set())
    const setSpy = jest.fn(() => (dummy = set.has(key)))
    observe(setSpy)

    expect(dummy).toBe(false)
    expect(setSpy).toHaveBeenCalledTimes(1)

    set.add({})
    expect(dummy).toBe(false)
    expect(setSpy).toHaveBeenCalledTimes(1)

    set.add(key)
    expect(dummy).toBe(true)
    expect(setSpy).toHaveBeenCalledTimes(2)
  })

  test('should wrap object values with observables when iterated', () => {
    const set = observable(new Set())
    set.add({})

    set.forEach((value) => expect(isObservable(value)).toBe(true))
    for (const value of set) {
      expect(isObservable(value)).toBe(true)
    }
    for (const [_, value] of set.entries()) {
      expect(isObservable(value)).toBe(true)
    }
    for (const value of set.values()) {
      expect(isObservable(value)).toBe(true)
    }
  })
})
