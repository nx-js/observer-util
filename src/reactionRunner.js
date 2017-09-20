import {
  registerReactionForKey,
  iterateReactionsForKey,
  releaseReaction
} from './store'
import { queueReaction, isReactionQueued } from './priorityQueue'

const AFTER_REACTION = Symbol('after reaction')
let runningReaction

// set the reaction as the currently running one
// this is required so that we can create (observable.prop -> reaction) pairs in the get trap
export function runReaction (reaction) {
  try {
    // delete all existing (obj.key -> reaction) connections
    releaseReaction(reaction)
    runningReaction = reaction
    // and reconstruct them in the get trap while the reaction is running
    reaction()
    afterReaction(reaction)
  } finally {
    // always remove the currently running flag from the reaction when it stops execution
    runningReaction = undefined
  }
}

function afterReaction (reaction) {
  if (reaction[AFTER_REACTION]) {
    reaction[AFTER_REACTION]()
    reaction[AFTER_REACTION] = undefined
  }
}

export function nextRun (reaction) {
  if (!isReactionQueued(reaction)) {
    return Promise.resolve()
  }
  return new Promise(resolve => (reaction[AFTER_REACTION] = resolve))
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

export function hasRunningReaction () {
  return runningReaction !== undefined
}
