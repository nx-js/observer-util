export function spy (fn) {
  function spyFn () {
    fn()
    spyFn.callCount++
    spyFn.args = Array.from(arguments)
  }
  spyFn.callCount = 0
  return spyFn
}
