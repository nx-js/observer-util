import {
  registerReactionForKey,
  iterateReactionsForKey
} from './store'

let runningReaction

export function runAsReaction (fn, reaction) {
  // throw an error if the reaction is unobserved
  if (reaction.runId === -1) {
    throw new Error(`Unobserved reactions can not be executed. You tried to run a reaction for ${fn}`)
  }
  try {
    // save a unique (incremental) id on the reaction, which identifies its last run
    reaction.runId++
    // set the reaction as the currently running one
    // this is required so that we can create (observable.prop -> reaction) pairs in the get trap
    runningReaction = reaction
    return fn()
  } finally {
    // always remove the currently running flag from the reaction when it stops execution
    runningReaction = undefined
  }
}

// register the currently running reaction to be queued again on obj.key mutations
export function registerRunningReactionForKey (obj, key) {
  if (runningReaction) {
    registerReactionForKey(obj, key, runningReaction)
  }
}

export function queueReactionsForKey (obj, key) {
  // iterate and queue every reaction, which is triggered by obj.key mutation
  iterateReactionsForKey(obj, key, queueReaction)
}

function queueReaction (reaction) {
  // queue the reaction for later execution or run it immediately
  if (reaction.queue) {
    reaction.queue.add(reaction)
  } else {
    reaction()
  }
}

export function hasRunningReaction () {
  return runningReaction !== undefined
}
