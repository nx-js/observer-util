import { has, get, set, deleteFn } from './collections'

export default function instrumentWeakMap (map) {
  map.has = has
  map.get = get
  map.set = set
  map.delete = deleteFn
}
