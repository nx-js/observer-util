export default function (task) {
  if (!task) {
    return new Promise(requestAnimationFrame)
  }
  return new Promise(resolve => requestAnimationFrame(() => {
    task()
    resolve()
  }))
}
