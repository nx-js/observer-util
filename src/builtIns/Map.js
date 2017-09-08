import {
  has,
  get,
  set,
  deleteFn,
  clear,
  forEach,
  keys,
  values,
  entries,
  iterator,
  getSize
} from './collections'

export default function instrumentMap (map) {
  map.has = has
  map.get = get
  map.set = set
  map.delete = deleteFn
  map.clear = clear
  map.forEach = forEach
  map.keys = keys
  map.values = values
  map.entries = entries
  map[Symbol.iterator] = iterator
  Object.defineProperty(map, 'size', { get: getSize })
}
