import { has, add, deleteFn, clear,
  forEach, keys, values, entries, iterator, getSize, setSize } from './collections'

export default function shim (target) {
  target.has = has
  target.add = add
  target.delete = deleteFn
  target.clear = clear
  target.forEach = forEach
  target.keys = keys
  target.values = values
  target.entries = entries
  target[Symbol.iterator] = iterator
  Object.defineProperty(target, 'size', { get: getSize, set: setSize })
  return target
}
