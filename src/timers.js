let nextTickQueued = false
let nextIdlePeriodQueued = false

const promise = Promise.resolve()
const requestIdlePeriod =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : setTimeout

export function nextTick (task) {
  if (!nextTickQueued) {
    promise.then(() => {
      // set this before executing the task so the task can set it back to true if needed
      nextTickQueued = false
      task()
    })
    nextTickQueued = true
  }
}

export function nextIdlePeriod (task) {
  if (!nextIdlePeriodQueued) {
    requestIdlePeriod(() => {
      // set this before executing the task so the task can set it back to true if needed
      nextIdlePeriodQueued = false
      task()
    })
    nextIdlePeriodQueued = true
  }
}
