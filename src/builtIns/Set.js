import {
  has,
  add,
  deleteFn,
  clear,
  forEach,
  keys,
  values,
  entries,
  iterator,
  getSize
} from './collections'

export default function instrumentSet (set) {
  set.has = has
  set.add = add
  set.delete = deleteFn
  set.clear = clear
  set.forEach = forEach
  set.keys = keys
  set.values = values
  set.entries = entries
  set[Symbol.iterator] = iterator
  Object.defineProperty(set, 'size', { get: getSize })
}
