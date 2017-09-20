export function spy (fn) {
  const spyFn = () => {
    fn()
    spyFn.callCount++
  }
  spyFn.callCount = 0
  return spyFn
}
