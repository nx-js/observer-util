const connectionStore = new WeakMap()
const ITERATION_KEY = Symbol('iteration key')

export function storeObservable (obj) {
  // this will be used to save (obj.key -> reaction) connections later
  connectionStore.set(obj, Object.create(null))
}

export function registerReactionForKey (reaction, { target, key, type }) {
  if (type === 'iterate') {
    key = ITERATION_KEY
  }

  const reactionsForObj = connectionStore.get(target)
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

export function getReactionsForKey ({ target, key, type }) {
  const reactionsForKey = new Set()

  if (type !== 'clear') {
    const setTypeReactions = connectionStore.get(target)[key]
    setTypeReactions && setTypeReactions.forEach(reactionsForKey.add, reactionsForKey)
  }

  if (type === 'add' || type === 'delete' || type === 'clear') {
    const iterationKey = Array.isArray(target) ? 'length' : ITERATION_KEY
    const addTypeReactions = connectionStore.get(target)[iterationKey]
    addTypeReactions && addTypeReactions.forEach(reactionsForKey.add, reactionsForKey)
  }

  return reactionsForKey
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
