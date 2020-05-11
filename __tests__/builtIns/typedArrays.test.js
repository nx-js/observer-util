import { observable, isObservable, observe } from '@nx-js/observer-util'

const TypedArrays = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array
]

describe('typed arrays', () => {
  for (const TypedArray of TypedArrays) {
    test(`${TypedArray.name} should observe mutations`, () => {
      let dummy
      const array = observable(new TypedArray(2))
      expect(isObservable(array)).toBe(true)

      observe(() => (dummy = array[0]))

      expect(dummy).toBe(0)
      array[0] = 12
      expect(dummy).toBe(12)
    })
  }
})
