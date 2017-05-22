import { has, get, set, deleteFn } from './collections'

export default function shim (target) {
  target.has = has
  target.get = get
  target.set = set
  target.delete = deleteFn
  return target
}
