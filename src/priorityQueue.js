import { nextTick, nextIdlePeriod } from './timers'
import { runReaction } from './reactionRunner'

export const TARGET_FPS = 60
const PRIORITY = Symbol('reaction priority')
let lastRun

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
  queueReactionProcessing(priority)
}

export function getPriority (reaction) {
  const priority = reaction[PRIORITY]
  if (!priority) {
    throw new TypeError('The first argument must be an active reaction.')
  }
  return priority
}

export function setPriority (reaction, priority) {
  const prevPriority = reaction[PRIORITY]
  if (!prevPriority) {
    throw new TypeError('The first argument must be an active reaction.')
  }
  if (priority === prevPriority) {
    return
  }
  validatePriority(priority)

  const prevQueue = queue[prevPriority]
  if (prevQueue.has(reaction)) {
    const nextQueue = queue[priority]
    prevQueue.delete(reaction)
    nextQueue.add(reaction)
  }
  reaction[PRIORITY] = priority
  queueReactionProcessing(priority)
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

function queueReactionProcessing (priority) {
  if (priority === priorities.CRITICAL) {
    nextTick(runQueuedCriticalReactions)
  } else {
    nextIdlePeriod(runQueuedIdleReactions)
  }
}

function runQueuedCriticalReactions () {
  // critical reactions must all execute before the next frame
  const criticalReactions = queue[priorities.CRITICAL]
  criticalReactions.forEach(runReaction)
  criticalReactions.clear()
}

function runQueuedIdleReactions () {
  lastRun = lastRun || Date.now()
  const interval = 1000 / TARGET_FPS
  // high-prio reactions can run if there is free time remaining
  const isHighPrioEmpty = processQueue(priorities.HIGH, interval)
  // low-prio reactions can run if there is free time and no more high-prio reactions
  const isLowPrioEmpty = processQueue(priorities.LOW, interval)

  if (isHighPrioEmpty && isLowPrioEmpty) {
    lastRun = undefined
  } else {
    nextIdlePeriod(runQueuedIdleReactions)
    lastRun = Date.now()
  }
}

function processQueue (priority, interval) {
  const queueWithPriority = queue[priority]
  const iterator = queueWithPriority[Symbol.iterator]()
  let reaction = iterator.next()
  while (Date.now() - lastRun < interval) {
    if (reaction.done) {
      return true
    }
    runReaction(reaction.value)
    queueWithPriority.delete(reaction.value)
    reaction = iterator.next()
  }
}
