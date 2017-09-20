const nextTick = (typeof window === 'undefined') ? process.nextTick : requestAnimationFrame

export default function (task) {
  if (!task) {
    return new Promise(nextTick)
  }
  return new Promise(resolve => nextTick(() => {
    task()
    resolve()
  }))
}
