import { InternalConfig } from './config'
import { createTransaction } from './transaction'

let actionCount = 0

export function action (target, propertyKey, descriptor) {
  if (!propertyKey) {
    // 1. use as function wrapper
    return createAction(target)
  }
  // 2. use as a decorator
  if (propertyKey in target) {
    // 2.1 use as class method decorator
    descriptor.value = createAction(descriptor.value)
    return
  }
  // 2.2 use as class attribute decorator
  const internalPropertyKey = Symbol(propertyKey)
  Object.defineProperty(target, propertyKey, {
    set: function (value) {
      if (!(internalPropertyKey in this)) {
        // must be attribute init setter，wrap it to a action
        value = createAction(value)
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

function duringAction () {
  return actionCount > 0
}

function startAction () {
  actionCount = actionCount + 1
}

function endAction () {
  actionCount = actionCount - 1
  if (actionCount < 0) {
    throw new Error(
      '[nemo-observable-util] call endAction but no action is running!'
    )
  }
}

function canWrite () {
  return !InternalConfig.onlyAllowChangeInAction || duringAction()
}

export const DISABLE_WRITE_ERR =
  '[nemo-observer-util] can not modify data outside @action'
export function writeAbleCheck () {
  if (!canWrite()) {
    throw new Error(DISABLE_WRITE_ERR)
  }
}

function createAction (fn) {
  const transactionFn = createTransaction(fn)
  return function (...args) {
    startAction()
    try {
      return transactionFn.apply(this, args)
    } finally {
      endAction()
    }
  }
}
