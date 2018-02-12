declare module '@nx-js/observer-util' {
  function observable<Observable extends object>(obj?: Observable): Observable
  function isObservable(obj: object): boolean
  function raw<Observable extends object>(obj: Observable): Observable

  interface Scheduler {
    add: Function
    delete: Function
  }

  interface ObserveOptions {
    scheduler?: Scheduler | Function
    debugger?: Function
    lazy?: boolean
  }

  function observe<Reaction extends Function>(func: Reaction, options?: ObserveOptions): Reaction
  function unobserve(func: Function): void
}
