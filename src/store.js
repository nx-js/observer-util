const observerStore = new WeakMap()

export function storeObservable (target) {
  observerStore.set(target, Object.create(null))
}

export function storeObserver (target, key, observer) {
  const observers = observerStore.get(target)
  const observersForKey = observers[key]
  if (observersForKey !== observer) {
    if (!observersForKey) {
      observers[key] = observer
    } else if (observersForKey instanceof Set) {
      observersForKey.add(observer)
    } else {
      observers[key] = new Set().add(observersForKey).add(observer)
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
