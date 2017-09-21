const nextTick =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : setTimeout

export default nextTick
