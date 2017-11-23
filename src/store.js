const connectionStore = new WeakMap()
const CLEANERS = Symbol('reaction cleaners')

export function storeObservable (obj) {
  // this will be used to save (obj.key -> reaction) connections later
  connectionStore.set(obj, Object.create(null))
}

export function storeReaction (reaction) {
  reaction[CLEANERS] = []
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
  reactionsForKey.marked = true
  reactionsForKey.key = key
}

function addReactionToReactionsForKey (reaction, reactionsForKey) {
  reactionsForKey.add(reaction)
  reaction[CLEANERS].push(reactionsForKey)
}

export function iterateReactionsForKey (obj, key, reactionHandler) {
  const reactionsForKey = connectionStore.get(obj)[key]
  if (reactionsForKey) {
    // the original reactionsForKey set is mutated by registerReactionForKey during the iteration
    // it must be cloned before the iteration to avoid infinite loops
    reactionsForKey.forEach(reactionHandler)
  }
}

export function releaseReaction (reaction) {
  if (reaction[CLEANERS]) {
    reaction[CLEANERS].forEach(releaseReactionKeyConnections, reaction)
  }
  reaction[CLEANERS] = undefined
}

function releaseReactionKeyConnections (reactionsForKey) {
  if (!reactionsForKey.disabled) {
    reactionsForKey.delete(this)
  }
}

export function pruneReaction (reaction) {
  if (reaction[CLEANERS]) {
    reaction[CLEANERS].forEach(pruneReactionKeyConnections, reaction)
  }
}

function pruneReactionKeyConnections (reactionsForKey) {
  if (!reactionsForKey.disabled && !reactionsForKey.marked) {
    reactionsForKey.delete(this)
    reactionsForKey.disabled = true
  }
  reactionsForKey.marked = false
}
