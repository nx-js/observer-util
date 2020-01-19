/**
 * Global Config
 * Todo: Support config per observable instance
 */
export const InternalConfig = {
  /**
   * whether to ignore something like `this.a = this.a`;
   */
  skipSameValueChange: false,
  /**
   * whether to disable modify outside `@action`
   */
  onlyAllowChangeInAction: false
}

export function config (c = {}) {
  Object.entries(c).forEach(([k, v]) => (InternalConfig[k] = v))
  return InternalConfig
}
