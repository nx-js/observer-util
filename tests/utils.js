const HEAVY_INTERVAL = 10

export function spy (fn) {
  const spyFn = () => {
    fn()
    spyFn.callCount++
  }
  spyFn.callCount = 0
  return spyFn
}

export function beforeNextFrame () {
  return new Promise(requestAnimationFrame)
}

export function heavyCalculation () {
  const start = Date.now()
  const parent = document.createElement('div')
  while (Date.now() - start < HEAVY_INTERVAL) {
    const child = document.createElement('div')
    parent.appendChild(child)
    parent.removeChild(child)
  }
  return Date.now() - start
}
