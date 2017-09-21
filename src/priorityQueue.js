import nextTick from './nextTick'
import { runReaction } from './reactionRunner'

export const TARGET_FPS = 30
const PRIORITY = Symbol('reaction priority')
let reactionProcessingQueued = false
let lastRun = Date.now()

export const priorities = {
  CRITICAL: 'critical',
  HIGH: 'high',
  LOW: 'low'
}

const DEFAULT_PRIORITY = priorities.CRITICAL

const validPriorities = new Set(['critical', 'high', 'low'])

const queue = {
  [priorities.CRITICAL]: new Set(),
  [priorities.HIGH]: new Set(),
  [priorities.LOW]: new Set()
}

export function initReaction (reaction, priority) {
  reaction[PRIORITY] = priority = priority || DEFAULT_PRIORITY
  validatePriority(priority)

  if (priority === priorities.CRITICAL) {
    // critical reactions execute once synchronously on init
    runReaction(reaction)
  } else {
    // otherwise queue it to run later
    queueReaction(reaction)
  }
}

export function queueReaction (reaction) {
  const priority = reaction[PRIORITY]
  queue[priority].add(reaction)
  if (!reactionProcessingQueued) {
    nextTick(runQueuedReactions)
    reactionProcessingQueued = true
  }
}

export function getPriority (reaction) {
  return reaction[PRIORITY]
}

export function setPriority (reaction, priority) {
  validatePriority(priority)
  const prevPriority = reaction[PRIORITY]
  const prevQueue = queue[prevPriority]
  if (prevQueue.has(reaction)) {
    const nextQueue = queue[priority]
    nextQueue.add(reaction)
    prevQueue.delete(reaction)
  }
  reaction[PRIORITY] = priority
}

function validatePriority (priority) {
  if (!validPriorities.has(priority)) {
    throw new Error(`Invalid priority: ${priority}`)
  }
}

export function isReactionQueued (reaction) {
  const priority = reaction[PRIORITY]
  return queue[priority].has(reaction)
}

export function unqueueReaction (reaction) {
  const priority = reaction[PRIORITY]
  queue[priority].delete(reaction)
}

export function runQueuedReactions () {
  const interval = 1000 / TARGET_FPS

  // critical reactions must all execute before the next frame
  const criticalReactions = queue[priorities.CRITICAL]
  criticalReactions.forEach(runReaction)
  criticalReactions.clear()

  // high-prio reactions can run if there is free time remaining
  const isHighPrioEmpty = processQueue(priorities.HIGH, interval)
  // low-prio reactions can run if there is free time and no more high-prio reactions
  const isLowPrioEmpty = processQueue(priorities.LOW, interval)

  if (isHighPrioEmpty && isLowPrioEmpty) {
    reactionProcessingQueued = false
  } else {
    nextTick(runQueuedReactions)
  }
  lastRun = Date.now()
}

function processQueue (priority, interval) {
  const queueWithPriority = queue[priority]
  const iterator = queueWithPriority[Symbol.iterator]()
  let reaction = iterator.next()
  while ((Date.now() - lastRun) < interval) {
    if (reaction.done) {
      return true
    }
    runReaction(reaction.value)
    queueWithPriority.delete(reaction.value)
    reaction = iterator.next()
  }
}
