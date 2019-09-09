export const InternalConfig = {
  skipSameValueChange: false
}

export function config (c = {}) {
  Object.entries(c).forEach(([k, v]) => (InternalConfig[k] = v))
  return InternalConfig
}
