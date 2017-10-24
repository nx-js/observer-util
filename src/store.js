const connectionStore = new WeakMap()
const CLEANERS = Symbol('reaction cleaners')

export function storeObservable (obj) {
  // this will be used to save (obj.key -> reaction) connections later
  connectionStore.set(obj, Object.create(null))
}

export function storeReaction (reaction) {
  // this will be used to save data for cleaning up later
  reaction[CLEANERS] = reaction[CLEANERS] || new Set()
}

export function registerReactionForKey (obj, key, reaction) {
  const reactionsForObj = connectionStore.get(obj)
  let reactionsForKey = reactionsForObj[key]
  if (!reactionsForKey) {
    reactionsForObj[key] = reactionsForKey = new Set()
  }
  reactionsForKey.add(reaction)
  reaction[CLEANERS].add(reactionsForKey)
}

export function iterateReactionsForKey (obj, key, fn) {
  const reactionsForKey = connectionStore.get(obj)[key]
  if (reactionsForKey) {
    reactionsForKey.forEach(fn)
  }
}

export function releaseReaction (reaction) {
  const cleaners = reaction[CLEANERS]
  cleaners.forEach(releaseReactionKeyConnections, reaction)
  cleaners.clear()
}

function releaseReactionKeyConnections (reactionsForKey) {
  reactionsForKey.delete(this)
}
