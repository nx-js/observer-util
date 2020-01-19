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

/**
 * wrapper sync function to support batch
 * @param {*} target
 * @param {*} propertyKey
 * @param {*} descriptor
 */
export function withTransaction (target, propertyKey, descriptor) {
  if (!propertyKey) {
    // 1. use as function wrapper
    return createTransaction(target)
  }
  // 2. use as a decorator
  if (propertyKey in target) {
    // 2.1 use as class method decorator
    descriptor.value = createTransaction(descriptor.value)
    return
  }

  // 2.2 use as class attribute decorator
  const internalPropertyKey = Symbol(propertyKey)
  Object.defineProperty(target, propertyKey, {
    set: function (value) {
      if (!(internalPropertyKey in this)) {
        // must be attribute init setter，wrap it to a action
        value = createTransaction(value)
      } else {
        // modify in running, not wrapper it，since decorator should just run in init phase
      }
      this[internalPropertyKey] = value
    },
    get: function () {
      return this[internalPropertyKey]
    }
  })
}

export function createTransaction (originalFunc) {
  if (typeof originalFunc !== 'function') {
    throw new Error(
      'transaction should must wrap on Function: ' + typeof originalFunc
    )
  }
  const identity = getUUID()
  return function (...args) {
    transaction.start(identity)
    try {
      return originalFunc.apply(this, args)
    } finally {
      transaction.end(identity)
    }
  }
}
