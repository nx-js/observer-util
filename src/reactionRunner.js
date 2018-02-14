import {
  registerReactionForOperation,
  getReactionsForOperation,
  releaseReaction
} from './store'

let runningReaction
let isDebugging = false

export function runAsReaction (reaction, fn, context, args) {
  // do not build reactive relations, if the reaction is unobserved
  if (reaction.unobserved) {
    return fn.apply(context, args)
  }

  // release the (obj -> key -> reactions) connections
  // and reset the cleaner connections
  releaseReaction(reaction)

  try {
    // set the reaction as the currently running one
    // this is required so that we can create (observable.prop -> reaction) pairs in the get trap
    runningReaction = reaction
    return fn.apply(context, args)
  } finally {
    // always remove the currently running flag from the reaction when it stops execution
    runningReaction = undefined
  }
}

// register the currently running reaction to be queued again on obj.key mutations
export function registerRunningReactionForOperation (operation) {
  if (runningReaction) {
    debugOperation(runningReaction, operation)
    registerReactionForOperation(runningReaction, operation)
  }
}

export function queueReactionsForOperation (operation) {
  // iterate and queue every reaction, which is triggered by obj.key mutation
  getReactionsForOperation(operation).forEach(queueReaction, operation)
}

function queueReaction (reaction) {
  debugOperation(reaction, this)
  // queue the reaction for later execution or run it immediately
  if (typeof reaction.scheduler === 'function') {
    reaction.scheduler(reaction)
  } else if (typeof reaction.scheduler === 'object') {
    reaction.scheduler.add(reaction)
  } else {
    reaction()
  }
}

function debugOperation (reaction, operation) {
  if (reaction.debugger && !isDebugging) {
    try {
      isDebugging = true
      reaction.debugger(operation)
    } finally {
      isDebugging = false
    }
  }
}

export function hasRunningReaction () {
  return runningReaction !== undefined
}
