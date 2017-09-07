const promise = Promise.resolve()

export default function nextTick (task) {
  return promise.then(task)
}
