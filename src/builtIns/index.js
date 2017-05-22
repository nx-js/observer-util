import InstrumentMap from './Map'
import InstrumentSet from './Set'
import InstrumentWeakMap from './WeakMap'
import InstrumentWeakSet from './WeakSet'

export default new Map([
  [Map.prototype, InstrumentMap],
  [Set.prototype, InstrumentSet],
  [WeakMap.prototype, InstrumentWeakMap],
  [WeakSet.prototype, InstrumentWeakSet],
  [Date.prototype, false],
  [RegExp.prototype, false]
])
