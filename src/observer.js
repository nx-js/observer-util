import { releaseReaction } from './store'
import { Queue } from './priorityQueue'
import { runAsReaction } from './reactionRunner'

const IS_REACTION = Symbol('is reaction')

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
  if (fn[IS_REACTION]) {
    throw new TypeError('The first argument must not be an already observed reaction')
  }

  // crate a reaction from the passed function
  const reaction = () => runAsReaction(fn, reaction)
  // save the queue on the reaction
  reaction.queue = queue
  // save the fact that this is a reaction
  reaction[IS_REACTION] = true
  return reaction
}

export function unobserve (reaction) {
  if (typeof reaction !== 'function' || !reaction[IS_REACTION]) {
    throw new TypeError(`The first argument must be a reaction instead of ${reaction}`)
  }
  // do not run this reaction anymore, even if it is already queued
  if (reaction.queue) {
    reaction.queue.remove(reaction)
  }
  // release every (observable.prop -> reaction) connections
  releaseReaction(reaction)
}
