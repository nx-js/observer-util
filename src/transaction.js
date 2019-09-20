import { queueReaction } from './reactionRunner'

let uuid = 0
function getUUID () {
  return uuid++
}
class TransactionManager {
  constructor () {
    this.runners = new Map()
    this.duringTransaction = false
    this.stacks = []
  }
  add (reaction, operation) {
    // use last operation as source
    this.runners.set(reaction, operation)
  }
  start (target) {
    this.duringTransaction = true
    this.stacks.push(target)
  }
  end (target) {
    const lastStack = this.stacks[this.stacks.length - 1]
    if (lastStack !== target) {
      throw new Error('transaction end not match with start')
    }
    this.stacks.pop()
    if (this.stacks.length === 0) {
      this.flush()
    }
  }
  flush () {
    // copy incase being modified during exec reaction
    const todoCopy = this.runners
    this.runners = new Map()
    this.duringTransaction = false

    for (const [reaction, operation] of todoCopy.entries()) {
      queueReaction(reaction, operation)
    }
  }
}

export const transaction = new TransactionManager()

export function startTransaction (target) {
  transaction.start(target)
}

export function endTransaction (target) {
  transaction.end(target)
}

// wrapper sync function to support transaction
export function withTransaction (target, propertyKey, descriptor) {
  const identity = getUUID()
  if (descriptor) {
    // use as class method decorator
    const originalFunc = descriptor.value
    descriptor.value = function (...args) {
      transaction.start(identity)
      const res = originalFunc.apply(this, args)
      transaction.end(identity)
      return res
    }
  } else {
    // use as function wrapper
    const originalFunc = target
    return function (...args) {
      transaction.start(identity)
      const res = originalFunc.apply(this, args)
      transaction.end(identity)
      return res
    }
  }
}
