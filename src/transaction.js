import { StackManager } from './utils/stack'
import { decoratorFactory } from './utils/decorator'
import { RunnerManager } from './utils/runner'

export const runnerManager = new RunnerManager()
export const transactionManager = new StackManager(runnerManager.flush)

export function startTransaction (target) {
  transactionManager.start(target)
}

export function endTransaction (target) {
  transactionManager.end(target)
}

/**
 * wrapper sync function to support batch
 * @param {*} target
 * @param {*} propertyKey
 * @param {*} descriptor
 */
export const withTransaction = decoratorFactory(createTransaction)

export function createTransaction (originalFunc) {
  if (typeof originalFunc !== 'function') {
    throw new Error(
      'transaction should must wrap on Function: ' + typeof originalFunc
    )
  }
  const identity = transactionManager.getUUID()
  return function (...args) {
    transactionManager.start(identity)
    try {
      return originalFunc.apply(this, args)
    } finally {
      transactionManager.end(identity)
    }
  }
}
