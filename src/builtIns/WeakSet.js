import { has, add, deleteFn } from './collections'

export default function instrumentWeakSet (set) {
  set.has = has
  set.add = add
  set.delete = deleteFn
}
