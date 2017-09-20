const nextTick =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : setTimeout

export default function (task) {
  if (!task) {
    return new Promise(nextTick)
  }
  return new Promise(resolve =>
    nextTick(() => {
      task()
      resolve()
    })
  )
}
