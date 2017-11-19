import { storeReaction, releaseReaction } from './store'
import { Queue, priorities } from './priorityQueue'
import { runAsReaction } from './reactionRunner'

const defaultQueue = new Queue(priorities.CRITICAL)

export function observe (fn, queue = defaultQueue) {
  if (typeof fn !== 'function') {
    throw new TypeError(`The first argument must be a function instead of ${fn}`)
  }
  if (!(queue instanceof Queue)) {
    throw new TypeError(`The second argument must be a Queue instance instead of ${queue}`)
  }

  // bind reaction together with the runner
  const reaction = runAsReaction.bind(null, fn)
  fn.reaction = reaction
  // save the queue on the reaction
  reaction.queue = queue
  // init basic data structures to save and cleanup (observable.prop -> reaction) connections later
  storeReaction(reaction)
  // execute reaction once to boot the observation process
  reaction()
  return reaction
}

export function unobserve (reaction) {
  // do not run this reaction anymore, even if it is already queued
  reaction.queue.remove(reaction)
  // release every (observable.prop -> reaction) connections
  releaseReaction(reaction)
}
