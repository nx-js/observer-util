import { nextTick, nextIdlePeriod } from './timers'

const TARGET_FPS = 60
const TARGET_INTERVAL = 1000 / TARGET_FPS
const QUEUE = Symbol('task queue')
let lastRun

export const priorities = {
  CRITICAL: 0,
  HIGH: 1,
  LOW: 2
}
const validPriorities = new Set([0, 1, 2])

const queues = {
  [priorities.CRITICAL]: new Set(),
  [priorities.HIGH]: new Set(),
  [priorities.LOW]: new Set()
}

export class Queue {
  constructor (priority) {
    this.priority = validatePriority(priority)
    this[QUEUE] = new Set()
    queues[this.priority].add(this[QUEUE])
  }

  has (task) {
    return this[QUEUE].has(task)
  }

  add (task) {
    if (typeof task !== 'function') {
      throw new Error(
        `${task} can not be added to the queue. Only functions can be added.`
      )
    }
    const queue = this[QUEUE]
    queue.add(task)
    queueTaskProcessing(this.priority)
  }

  delete (task) {
    this[QUEUE].delete(task)
  }

  start () {
    queues[this.priority].add(this[QUEUE])
  }

  stop () {
    queues[this.priority].delete(this[QUEUE])
  }

  clear () {
    this[QUEUE].clear()
  }

  process () {
    const queue = this[QUEUE]
    queue.forEach(runTask)
    queue.clear()
  }
}

function validatePriority (priority) {
  if (!validPriorities.has(priority)) {
    throw new Error(`Invalid queue priority: ${priority}`)
  }
  return priority
}

function queueTaskProcessing (priority) {
  if (priority === priorities.CRITICAL) {
    nextTick(runQueuedCriticalTasks)
  } else {
    nextIdlePeriod(runQueuedIdleTasks)
  }
}

function runQueuedCriticalTasks () {
  // critical tasks must all execute before the next frame
  const criticalQueues = queues[priorities.CRITICAL]
  criticalQueues.forEach(processCriticalQueue)
}

function processCriticalQueue (queue) {
  queue.forEach(runTask)
  queue.clear()
}

function runTask (task) {
  task()
}

function runQueuedIdleTasks () {
  lastRun = lastRun || Date.now()

  let timeRemaining = processIdleQueues(priorities.HIGH)

  if (timeRemaining) {
    timeRemaining = processIdleQueues(priorities.LOW)
  }

  // if there is free time remaining there are no more tasks to run
  if (timeRemaining) {
    lastRun = undefined
  } else {
    nextIdlePeriod(runQueuedIdleTasks)
    lastRun = Date.now()
  }
}

function processIdleQueues (priority) {
  const iterator = queues[priority][Symbol.iterator]()
  const startingQueue = iterator.next()
  let queue = startingQueue
  let timeRemaining = true

  do {
    timeRemaining = timeRemaining && processIdleQueue(queue)
    moveQueueToEnd(queues, queue)
    queue = iterator.next()
  } while (startingQueue !== queue && timeRemaining)

  return timeRemaining
}

function processIdleQueue (queue) {
  const iterator = queue[Symbol.iterator]()
  let task = iterator.next()
  while (Date.now() - lastRun < TARGET_INTERVAL) {
    if (task.done) {
      return true
    }
    // run the task
    task.value()
    queue.delete(task.value)
    task = iterator.next()
  }
}

function moveQueueToEnd (queues, queue) {
  // delete and readd the queue to move it to the end
  queues.delete(queue)
  queues.add(queue)
}
