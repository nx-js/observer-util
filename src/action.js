import { InternalConfig } from './config'
import { createTransaction } from './transaction'
import { StackManager } from './utils/stack'
import { decoratorFactory } from './utils/decorator'

export const action = decoratorFactory(createAction)
export const actionManager = new StackManager()

function canWrite () {
  return !InternalConfig.onlyAllowChangeInAction || actionManager.duringStack
}

export const DISABLE_WRITE_ERR =
  '[nemo-observable-util] can not modify data outside @action'
export function writeAbleCheck () {
  if (!canWrite()) {
    throw new Error(DISABLE_WRITE_ERR)
  }
}

function createAction (originalFunc) {
  if (typeof originalFunc !== 'function') {
    throw new Error(
      'action should must wrap on Function: ' + typeof originalFunc
    )
  }
  const transactionFn = createTransaction(originalFunc)
  const identity = actionManager.getUUID()
  return function (...args) {
    actionManager.start(identity)
    try {
      return transactionFn.apply(this, args)
    } finally {
      actionManager.end(identity)
    }
  }
}
