const connectionStore = new WeakMap()
const cleanupStore = new WeakMap()

export function storeObservable (obj) {
  // this will be used to save (obj.key -> reaction) connections later
  connectionStore.set(obj, Object.create(null))
}

export function storeReaction (reaction) {
  // this will be used to save data for cleaning up later
  cleanupStore.set(reaction, new Set())
}

export function registerReactionForKey (obj, key, reaction) {
  const reactionsForObj = connectionStore.get(obj)
  let reactionsForKey = reactionsForObj[key]
  if (!reactionsForKey) {
    reactionsForObj[key] = reactionsForKey = new Set()
  }
  reactionsForKey.add(reaction)
  cleanupStore.get(reaction).add(reactionsForKey)
}

export function iterateReactionsForKey (obj, key, fn) {
  const reactionsForKey = connectionStore.get(obj)[key]
  if (reactionsForKey) {
    reactionsForKey.forEach(fn)
  }
}

export function releaseReaction (reaction) {
  cleanupStore.get(reaction).forEach(releaseReactionKeyConnections, reaction)
}

function releaseReactionKeyConnections (reactionsForKey) {
  reactionsForKey.delete(this)
}
