import { has, add, deleteFn } from './collections'

export default function instrumentWeakSet (target) {
  target.has = has
  target.add = add
  target.delete = deleteFn
}
