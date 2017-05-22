import { has, add, deleteFn } from './collections'

export default function shim (target) {
  target.has = has
  target.add = add
  target.delete = deleteFn
  return target
}
