import MapShim from './Map'
import SetShim from './Set'
import WeakMapShim from './WeakMap'
import WeakSetShim from './WeakSet'

export default new Map([
  [Map.prototype, MapShim],
  [Set.prototype, SetShim],
  [WeakMap.prototype, WeakMapShim],
  [WeakSet.prototype, WeakSetShim],
  [Date.prototype, true],
  [RegExp.prototype, true]
])
