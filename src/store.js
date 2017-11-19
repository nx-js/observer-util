const connectionStore = new WeakMap()
const CLEANERS = Symbol('reaction cleaners')

export function storeObservable (obj) {
  // this will be used to save (obj.key -> reaction) connections later
  connectionStore.set(obj, Object.create(null))
}

export function registerReactionForKey (obj, key, reaction) {
  const reactionsForObj = connectionStore.get(obj)
  let reactionsForKey = reactionsForObj[key]
  if (!reactionsForKey) {
    reactionsForObj[key] = reactionsForKey = new Set()
    addReactionToReactionsForKey(reaction, reactionsForKey)
  } else if (!reactionsForKey.has(reaction)) {
    addReactionToReactionsForKey(reaction, reactionsForKey)
  }
}

function addReactionToReactionsForKey (reaction, reactionsForKey) {
  reactionsForKey.add(reaction)
  reaction[CLEANERS].push(reactionsForKey)
}

export function iterateReactionsForKey (obj, key, fn) {
  const reactionsForKey = connectionStore.get(obj)[key]
  if (reactionsForKey) {
    reactionsForKey.forEach(fn)
  }
}

export function releaseReaction (reaction) {
  if (reaction[CLEANERS]) {
    reaction[CLEANERS].forEach(releaseReactionKeyConnections, reaction)
  }
  reaction[CLEANERS] = []
}

function releaseReactionKeyConnections (reactionsForKey) {
  reactionsForKey.delete(this)
}
