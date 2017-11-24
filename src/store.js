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
  }
  // save the fact that the key is used by the reaction during its current run
  reactionsForKey.set(reaction, reaction.runId)
}

export function iterateReactionsForKey (obj, key, reactionHandler) {
  const reactionsForKey = connectionStore.get(obj)[key]
  if (reactionsForKey) {
    reactionsForKey.forEach(handleReaction, reactionHandler)
  }
}

function handleReaction (runId, reaction, reactionsForKey) {
  if (reaction.runId !== runId) {
    // delete the (key -> reaction) connection if the key was not accessed
    // during the last run of the reaction, or the reaction is unobserved
    reactionsForKey.delete(reaction)
  } else {
    // otherwise pass the reaction to the reactionHandler (this)
    this(reaction)
  }
}
