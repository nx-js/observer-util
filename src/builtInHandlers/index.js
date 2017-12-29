import collectionHandlers from './collections'

export default new Map([
  // built-in object can not be wrapped by Proxies
  // their methods expect the object instance as the 'this' instead of the Proxy wrapper
  // complex objects are wrapped with a Proxy of instrumented methods
  // which switch the proxy to the raw object and to add reactive wiring
  [Map.prototype, collectionHandlers],
  [Set.prototype, collectionHandlers],
  [WeakMap.prototype, collectionHandlers],
  [WeakSet.prototype, collectionHandlers],
  // simple objects are not wrapped by Proxies, neither instrumented
  [Date.prototype, false],
  [RegExp.prototype, false]
])
