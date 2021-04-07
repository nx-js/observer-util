/* eslint no-unused-expressions: 0, no-unused-vars: 0 */

import { observable, isObservable, observe, raw } from '@nx-js/observer-util'

describe('WeakMap', () => {
  test('should be a proper JS WeakMap', () => {
    const map = observable(new WeakMap())
    expect(map).toBeInstanceOf(WeakMap)
    expect(raw(map)).toBeInstanceOf(WeakMap)
  })

  test('should observe mutations', () => {
    let dummy
    const key = {}
    const map = observable(new WeakMap())
    observe(() => (dummy = map.get(key)))

    expect(dummy).toBe(undefined)
    map.set(key, 'value')
    expect(dummy).toBe('value')
    map.set(key, 'value2')
    expect(dummy).toBe('value2')
    map.delete(key)
    expect(dummy).toBe(undefined)
  })

  test('should not observe custom property mutations', () => {
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = map.customProp))

    expect(dummy).toBe(undefined)
    map.customProp = 'Hello World'
    expect(dummy).toBe(undefined)
  })

  test('should not observe non value changing mutations', () => {
    let dummy
    const key = {}
    const map = observable(new WeakMap())
    const mapSpy = jest.fn(() => (dummy = map.get(key)))
    observe(mapSpy)

    expect(dummy).toBe(undefined)
    expect(mapSpy).toHaveBeenCalledTimes(1)
    map.set(key, 'value')
    expect(dummy).toBe('value')
    expect(mapSpy).toHaveBeenCalledTimes(2)
    map.set(key, 'value')
    expect(dummy).toBe('value')
    expect(mapSpy).toHaveBeenCalledTimes(2)
    map.delete(key)
    expect(dummy).toBe(undefined)
    expect(mapSpy).toHaveBeenCalledTimes(3)
    map.delete(key)
    expect(dummy).toBe(undefined)
    expect(mapSpy).toHaveBeenCalledTimes(3)
  })

  test('should not observe raw data', () => {
    const key = {}
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = raw(map).get(key)))

    expect(dummy).toBe(undefined)
    map.set(key, 'Hello')
    expect(dummy).toBe(undefined)
    map.delete(key)
    expect(dummy).toBe(undefined)
  })

  test('should not be triggered by raw mutations', () => {
    const key = {}
    let dummy
    const map = observable(new WeakMap())
    observe(() => (dummy = map.get(key)))

    expect(dummy).toBe(undefined)
    raw(map).set(key, 'Hello')
    expect(dummy).toBe(undefined)
    raw(map).delete(key)
    expect(dummy).toBe(undefined)
  })

  test('should wrap object values with observables when requested', () => {
    const key = {}
    const key2 = {}
    const map = observable(new Map())
    map.set(key, {})

    expect(isObservable(map.get(key))).toBe(true)
  })
})
