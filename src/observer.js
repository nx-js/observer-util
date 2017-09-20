import { storeReaction, releaseReaction } from './store'
import { initReaction, unqueueReaction } from './priorityQueue'
import { runReaction } from './reactionRunner'

export function observe (reaction, priority) {
  if (typeof reaction !== 'function') {
    throw new TypeError('Reactions must be functions.')
  }
  // init basic data structures to save and cleanup (observable.prop -> reaction) connections later
  storeReaction(reaction)
  // set up a priority for reaction processing and
  // queue/run the reaction once to discover which observable properties it uses
  initReaction(reaction, priority)
  return reaction
}

export function unobserve (reaction) {
  // do not run this reaction anymore, even if it is already queued
  unqueueReaction(reaction)
  // release every (observable.prop -> reaction) connections
  releaseReaction(reaction)
}

export function unqueue (reaction) {
  // do not run this reaction, if it is not queued again by a prop mutation
  unqueueReaction(reaction)
}

export function exec (reaction) {
  runReaction(reaction)
}
