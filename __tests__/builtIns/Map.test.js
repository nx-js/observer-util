/* eslint no-unused-expressions: 0, no-unused-vars: 0 */

import { observable, isObservable, observe, raw } from '@nx-js/observer-util'

describe('Map', () => {
  test('should be a proper JS Map', () => {
    const map = observable(new Map())
    expect(map).toBeInstanceOf(Map)
    expect(raw(map)).toBeInstanceOf(Map)
  })

  test('should observe mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.get('key')))

    expect(dummy).toBe(undefined)
    map.set('key', 'value')
    expect(dummy).toBe('value')
    map.set('key', 'value2')
    expect(dummy).toBe('value2')
    map.delete('key')
    expect(dummy).toBe(undefined)
  })

  test('should observe size mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.size))

    expect(dummy).toBe(0)
    map.set('key1', 'value')
    map.set('key2', 'value2')
    expect(dummy).toBe(2)
    map.delete('key1')
    expect(dummy).toBe(1)
    map.clear()
    expect(dummy).toBe(0)
  })

  test('should observe for of iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (const [key, num] of map) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    map.set('key0', 3)
    expect(dummy).toBe(3)
    map.set('key1', 2)
    expect(dummy).toBe(5)
    map.delete('key0')
    expect(dummy).toBe(2)
    map.clear()
    expect(dummy).toBe(0)
  })

  test('should observe forEach iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      map.forEach((num) => (dummy += num))
    })

    expect(dummy).toBe(0)
    map.set('key0', 3)
    expect(dummy).toBe(3)
    map.set('key1', 2)
    expect(dummy).toBe(5)
    map.delete('key0')
    expect(dummy).toBe(2)
    map.clear()
    expect(dummy).toBe(0)
  })

  test('should observe keys iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      for (const key of map.keys()) {
        dummy += key
      }
    })

    expect(dummy).toBe(0)
    map.set(3, 3)
    expect(dummy).toBe(3)
    map.set(2, 2)
    expect(dummy).toBe(5)
    map.delete(3)
    expect(dummy).toBe(2)
    map.clear()
    expect(dummy).toBe(0)
  })

  test('should observe values iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      for (const num of map.values()) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    map.set('key0', 3)
    expect(dummy).toBe(3)
    map.set('key1', 2)
    expect(dummy).toBe(5)
    map.delete('key0')
    expect(dummy).toBe(2)
    map.clear()
    expect(dummy).toBe(0)
  })

  test('should observe entries iteration', () => {
    let dummy
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (const [key, num] of map.entries()) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    map.set('key0', 3)
    expect(dummy).toBe(3)
    map.set('key1', 2)
    expect(dummy).toBe(5)
    map.delete('key0')
    expect(dummy).toBe(2)
    map.clear()
    expect(dummy).toBe(0)
  })

  test('should be triggered by clearing', () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.get('key')))

    expect(dummy).toBe(undefined)
    map.set('key', 3)
    expect(dummy).toBe(3)
    map.clear()
    expect(dummy).toBe(undefined)
  })

  test('should not observe custom property mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.customProp))

    expect(dummy).toBe(undefined)
    map.customProp = 'Hello World'
    expect(dummy).toBe(undefined)
  })

  test('should not observe non value changing mutations', () => {
    let dummy
    const map = observable(new Map())
    const mapSpy = jest.fn(() => (dummy = map.get('key')))
    observe(mapSpy)

    expect(dummy).toBe(undefined)
    expect(mapSpy).toHaveBeenCalledTimes(1)
    map.set('key', 'value')
    expect(dummy).toBe('value')
    expect(mapSpy).toHaveBeenCalledTimes(2)
    map.set('key', 'value')
    expect(dummy).toBe('value')
    expect(mapSpy).toHaveBeenCalledTimes(2)
    map.delete('key')
    expect(dummy).toBe(undefined)
    expect(mapSpy).toHaveBeenCalledTimes(3)
    map.delete('key')
    expect(dummy).toBe(undefined)
    expect(mapSpy).toHaveBeenCalledTimes(3)
    map.clear()
    expect(dummy).toBe(undefined)
    expect(mapSpy).toHaveBeenCalledTimes(3)
  })

  test('should not observe raw data', () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = raw(map).get('key')))

    expect(dummy).toBe(undefined)
    map.set('key', 'Hello')
    expect(dummy).toBe(undefined)
    map.delete('key')
    expect(dummy).toBe(undefined)
  })

  test('should not observe raw iterations', () => {
    let dummy = 0
    const map = observable(new Map())
    observe(() => {
      dummy = 0
      // eslint-disable-next-line no-unused-vars
      for (const [key, num] of raw(map).entries()) {
        dummy += num
      }
      for (const key of raw(map).keys()) {
        dummy += raw(map).get(key)
      }
      for (const num of raw(map).values()) {
        dummy += num
      }
      raw(map).forEach((num, key) => {
        dummy += num
      })
      // eslint-disable-next-line no-unused-vars
      for (const [key, num] of raw(map)) {
        dummy += num
      }
    })

    expect(dummy).toBe(0)
    map.set('key1', 2)
    map.set('key2', 3)
    expect(dummy).toBe(0)
    map.delete('key1')
    expect(dummy).toBe(0)
  })

  test('should not be triggered by raw mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.get('key')))

    expect(dummy).toBe(undefined)
    raw(map).set('key', 'Hello')
    expect(dummy).toBe(undefined)
    dummy = 'Thing'
    raw(map).delete('key')
    expect(dummy).toBe('Thing')
    raw(map).clear()
    expect(dummy).toBe('Thing')
  })

  test('should not observe raw size mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = raw(map).size))

    expect(dummy).toBe(0)
    map.set('key', 'value')
    expect(dummy).toBe(0)
  })

  test('should not be triggered by raw size mutations', () => {
    let dummy
    const map = observable(new Map())
    observe(() => (dummy = map.size))

    expect(dummy).toBe(0)
    raw(map).set('key', 'value')
    expect(dummy).toBe(0)
  })

  test('should support objects as key', () => {
    let dummy
    const key = {}
    const map = observable(new Map())
    const mapSpy = jest.fn(() => (dummy = map.get(key)))
    observe(mapSpy)

    expect(dummy).toBe(undefined)
    expect(mapSpy).toHaveBeenCalledTimes(1)

    map.set(key, 1)
    expect(dummy).toBe(1)
    expect(mapSpy).toHaveBeenCalledTimes(2)

    map.set({}, 2)
    expect(dummy).toBe(1)
    expect(mapSpy).toHaveBeenCalledTimes(2)
  })

  test('should wrap object values with observables when retrieved', () => {
    const map = observable(new Map())
    map.set('key', {})

    expect(isObservable(map.get('key'))).toBe(true)
  })

  test('should wrap object values with observables when iterated', () => {
    const map = observable(new Map())
    map.set('key', {})

    map.forEach((value) => expect(isObservable(value)).toBe(true))
    for (const [key, value] of map) {
      expect(isObservable(value)).toBe(true)
    }
    for (const [key, value] of map.entries()) {
      expect(isObservable(value)).toBe(true)
    }
    for (const value of map.values()) {
      expect(isObservable(value)).toBe(true)
    }
  })
})
