const promise = Promise.resolve()

// schedule the given task as a microtask
// (this used to leak into after the next task when mixed with MutationObservers in Safari)
export default function nextTick (task) {
  return promise.then(task)
}
