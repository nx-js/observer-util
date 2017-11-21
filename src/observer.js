import { releaseReaction } from './store'
import { Queue } from './priorityQueue'
import { runAsReaction } from './reactionRunner'

export function observe (fn, queue) {
  const reaction = observeLazy(fn, queue)
  // execute reaction once to boot the observation process
  reaction()
  return reaction
}

export function observeLazy (fn, queue) {
  if (typeof fn !== 'function') {
    throw new TypeError(
      `The first argument must be a function instead of ${fn}`
    )
  }
  if (queue !== undefined && !(queue instanceof Queue)) {
    throw new TypeError(
      `The second argument must be undefined or a Queue instance instead of ${queue}`
    )
  }

  // bind reaction together with the runner
  const reaction = runAsReaction.bind(fn)
  fn.reaction = reaction
  // save the queue on the reaction
  reaction.queue = queue
  return reaction
}

export function unobserve (reaction) {
  // do not run this reaction anymore, even if it is already queued
  if (reaction.queue) {
    reaction.queue.remove(reaction)
  }
  // release every (observable.prop -> reaction) connections
  releaseReaction(reaction)
}
