import { Queue } from '@nx-js/queue-util'
import { runAsReaction } from './reactionRunner'

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

  // crate a reaction from the passed function
  const reaction = () => runAsReaction(fn, reaction)
  // save the queue on the reaction
  reaction.queue = options.queue
  //
  reaction.cleaners = []
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

function validateOptions ({ lazy = false, queue }) {
  if (typeof lazy !== 'boolean') {
    throw new TypeError(`options.lazy must be a boolean or undefined instead of ${lazy}`)
  }
  if (!(queue === undefined || queue instanceof Queue)) {
    throw new TypeError(`options.queue must be a queue instance or undefined instead of ${queue}`)
  }
}

export function unobserve (reaction) {
  if (typeof reaction !== 'function' || !reaction[IS_REACTION]) {
    throw new TypeError(`The first argument must be a reaction instead of ${reaction}`)
  }
  // do not run this reaction anymore, even if it is already queued
  if (reaction.queue) {
    reaction.queue.delete(reaction)
  }
  // indicate that the reaction should not be triggered any more
  reaction.runId = -1
}
