const connectionStore = new WeakMap()
const observerStore = new WeakMap()

export function storeObservable (target) {
  observerStore.set(target, Object.create(null))
}

export function initObserver (observer) {
  connectionStore.set(observer, new Set())
}

export function storeObserver (target, key, observer) {
  const observers = observerStore.get(target)
  let observersForKey = observers[key]
  if (!observersForKey) {
    observers[key] = observersForKey = new Set()
  }
  observersForKey.add(observer)
  connectionStore.get(observer).add(observersForKey)
}

export function iterateObservers (target, key, fn) {
  const observersForKey = observerStore.get(target)[key]
  if (observersForKey) {
    observersForKey.forEach(fn)
  }
}

export function releaseObserver (observer) {
  connectionStore.get(observer).forEach(releaseConnection, observer)
}

function releaseConnection (observersForKey) {
  observersForKey.delete(this)
}
