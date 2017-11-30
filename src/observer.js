import { runAsReaction } from './reactionRunner'
import { releaseReaction } from './store'

const IS_REACTION = Symbol('is reaction')

export function observe (fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError(
      `The first argument must be a function instead of ${fn}`
    )
  }
  if (fn[IS_REACTION]) {
    throw new TypeError('The first argument must not be an already observed reaction')
  }
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(
      `The second argument must be an options object instead of ${options}`
    )
  }
  validateOptions(options)

  // create a reaction from the passed function
  function reaction () {
    return runAsReaction(reaction, fn, this, arguments)
  }
  // save the scheduler on the reaction
  reaction.scheduler = options.scheduler
  // runId will serve as a unique (incremental) id, which identifies the reaction's last run
  reaction.runId = 0
  // save the fact that this is a reaction
  reaction[IS_REACTION] = true
  // run the reaction once if it is not a lazy one
  if (!options.lazy) {
    reaction()
  }
  return reaction
}

function validateOptions ({ lazy = false, scheduler }) {
  if (typeof lazy !== 'boolean') {
    throw new TypeError(`options.lazy must be a boolean or undefined instead of ${lazy}`)
  }
  if (scheduler !== undefined && typeof scheduler !== 'function') {
    throw new TypeError(`options.scheduler must be a function or undefined instead of ${scheduler}`)
  }
}

export function unobserve (reaction) {
  if (typeof reaction !== 'function' || !reaction[IS_REACTION]) {
    throw new TypeError(`The first argument must be a reaction instead of ${reaction}`)
  }
  // do nothing, if the reaction is already unobserved
  if (!reaction.unobserved) {
    // indicate that the reaction should not be triggered any more
    reaction.unobserved = true
    // release (obj -> key -> reaction) connections
    releaseReaction(reaction)
  }
}
