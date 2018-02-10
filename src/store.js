const connectionStore = new WeakMap()

export function storeObservable (obj) {
  // this will be used to save (obj.key -> reaction) connections later
  connectionStore.set(obj, Object.create(null))
}

export function registerReactionForKey (obj, key, reaction) {
  const reactionsForObj = connectionStore.get(obj)
  let reactionsForKey = reactionsForObj[key]
  if (!reactionsForKey) {
    reactionsForObj[key] = reactionsForKey = new Set()
  }
  // save the fact that the key is used by the reaction during its current run
  if (!reactionsForKey.has(reaction)) {
    reactionsForKey.add(reaction)
    reaction.cleaners.push(reactionsForKey)
  }
}

export function iterateReactionsForKey (obj, key, reactionHandler) {
  const reactionsForKey = connectionStore.get(obj)[key]
  if (reactionsForKey) {
    // create a static copy of the reactions, before iterating them
    // to avoid infinite (iterate items: remove -> readd) loops
    Array.from(reactionsForKey).forEach(reactionHandler)
  }
}

export function releaseReaction (reaction) {
  if (reaction.cleaners) {
    reaction.cleaners.forEach(releaseReactionKeyConnection, reaction)
  }
  reaction.cleaners = []
}

function releaseReactionKeyConnection (reactionsForKey) {
  reactionsForKey.delete(this)
}
