import InstrumentMap from './Map'
import InstrumentSet from './Set'
import InstrumentWeakMap from './WeakMap'
import InstrumentWeakSet from './WeakSet'

// built-in object can not be wrapped by Proxies
// their methods expect the object instance as the 'this' and when a Proxy instance is passed instead they break
// simple objects are not wrapped by Proxies or instrumented
// complex objects are wrapped and their methods are monkey patched
// to switch the proxy to the raw object and to add reactive wiring
export default new Map([
  [Map.prototype, InstrumentMap],
  [Set.prototype, InstrumentSet],
  [WeakMap.prototype, InstrumentWeakMap],
  [WeakSet.prototype, InstrumentWeakSet],
  [Date.prototype, false],
  [RegExp.prototype, false]
])
