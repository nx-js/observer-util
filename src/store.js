const connectionStore = new WeakMap()

export function storeObservable (obj) {
  // this will be used to save (obj.key -> reaction) connections later
  connectionStore.set(obj, Object.create(null))
}

export function registerReactionForKey (obj, key, reaction) {
  const reactionsForObj = connectionStore.get(obj)
  let reactionsForKey = reactionsForObj[key]
  if (!reactionsForKey) {
    reactionsForObj[key] = reactionsForKey = new Map()
    reaction.cleaners.push(reactionsForKey)
  } else if (!reactionsForKey.has(reaction)) {
    reaction.cleaners.push(reactionsForKey)
  }
  // save the fact that the key is used by the reaction during its current run
  reactionsForKey.set(reaction, reaction.runId)
}

export function iterateReactionsForKey (obj, key, reactionHandler) {
  const reactionsForKey = connectionStore.get(obj)[key]
  if (reactionsForKey) {
    reactionsForKey.forEach(reactionHandler)
  }
}

export function releaseReaction (reaction) {
  reaction.cleaners.forEach(releaseReactionKeyConnections, reaction)
  reaction.cleaners = undefined
}

function releaseReactionKeyConnections (reactionsForKey) {
  reactionsForKey.delete(this)
}
