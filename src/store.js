import { UNOBSERVED } from './internals'

const observerStore = new WeakMap()

export function storeObservable (target) {
  observerStore.set(target, Object.create(null))
}

export function storeObserver (target, key, observer) {
  const observers = observerStore.get(target)
  const observersForKey = observers[key]
  if (observersForKey !== observer) {
    if (!observersForKey || observersForKey[UNOBSERVED] || !observersForKey.size) {
      observers[key] = observer
    } else if (observersForKey instanceof Set) {
      observersForKey.add(observer)
      observer[`_${key}_observers`] = observersForKey
    } else {
      observers[key] = new Set().add(observer)
      if (!observersForKey[UNOBSERVED]) {
        observers[key].add(observersForKey)
      }
    }
  }
}

export function iterateObservers (target, key, fn) {
  const observers = observerStore.get(target)
  const observersForKey = observers[key]
  if (observersForKey instanceof Set) {
    observersForKey.forEach(fn)
  } else if (observersForKey) {
    fn(observersForKey)
  }
}

export function releaseObserver (observer) {
  for (let key in observer) {
    observer[key].delete(observer)
  }
}
