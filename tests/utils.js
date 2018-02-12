export function spy (fn) {
  function spyFn () {
    fn()
    spyFn.callCount++
    spyFn.lastArgs = Array.from(arguments)
    spyFn.args.push(spyFn.lastArgs)
  }
  spyFn.callCount = 0
  spyFn.args = []
  return spyFn
}
