declare module '@nx-js/observer-util' {
  class ObservableBrand {
        protected __OBSERVABLE_NOMINAL_BRAND: never;
  }

  type Observed<T> = T & ObservableBrand;

  type MonoObserved<T> = T extends Observed<infer U>
    ? MonoObserved<U>
    : T;

  function observable<Observable extends object>(obj?: Observable): Observed<MonoObserved<Observable>>
  function isObservable(obj: object): boolean
  function raw<Observable extends object>(obj: Observable): Observable extends Observed<infer T> ? MonoObserved<T> : Observable;

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
