import { InternalConfig } from './config'
import { createTransaction, transactionManager } from './transaction'
import { StackManager } from './utils/stack'
import { decoratorFactory, NemoObservableInfo } from './utils/decorator'

export const action = decoratorFactory(createAction, createAction)
export const asyncAction = decoratorFactory(createAsyncAction, createAction)
export const actionManager = new StackManager()

function canWrite (target, key) {
  if (!InternalConfig.onlyAllowChangeInAction) {
    return true
  }
  if (actionManager.duringStack) {
    return true
  }
  const proto = Object.getPrototypeOf(target)
  if (proto && proto[NemoObservableInfo] && proto[NemoObservableInfo][key]) {
    return true
  }
  return false
}

export const DISABLE_WRITE_ERR =
  '[nemo-observable-util] can not modify data outside @action'
export function writeAbleCheck (target, key) {
  if (!canWrite(target, key)) {
    throw new Error(DISABLE_WRITE_ERR)
  }
}

export function createAction (originalFunc) {
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
function createAsyncAction (originalFunc) {
  if (typeof originalFunc !== 'function') {
    throw new Error(
      'action should must wrap on Function: ' + typeof originalFunc
    )
  }
  const actionId = actionManager.getUUID()
  const transactionId = transactionManager.getUUID()
  return function (...args) {
    const start = () => {
      actionManager.start(actionId)
      transactionManager.start(transactionId)
    }
    const end = () => {
      transactionManager.end(transactionId)
      actionManager.end(actionId)
    }
    let res
    try {
      start()
      res = originalFunc.apply(this, args)
      if (!res || !res.then || typeof res.then !== 'function') {
        throw new Error(
          'asyncAction should must wrap on Async Function: ' + originalFunc.name
        )
      }
      if (!res.finally) {
        res.then(end)
        res.catch(end)
      } else {
        res.finally(end)
      }
    } finally {
      end()
    }
    return res
  }
}
export function runInAction (fn) {
  return action(fn)()
}
