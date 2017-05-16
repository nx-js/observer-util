'use strict'

module.exports = {
  registerObservable,
  registerObserver,
  iterateObservers
}

const observerStore = new WeakMap()

function registerObservable (target) {
  observerStore.set(target, Object.create(null))
}

function registerObserver (target, key, observer) {
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

function iterateObservers (target, key, fn) {
  const observers = observerStore.get(target)
  const observersForKey = observers[key]
  if (observersForKey instanceof Set) {
    observersForKey.forEach(fn)
  } else if (observersForKey) {
    fn(observersForKey)
  }
}
