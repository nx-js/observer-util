declare module '@nx-js/observer-util' {
  interface ProxyHandlers {
    apply?(target: Function, thisArgument: any, argumentsList: ArrayLike<any>): any;
    construct?(target: Function, argumentsList: ArrayLike<any>, newTarget?: any): any;
    defineProperty?(target: object, propertyKey: PropertyKey, attributes: PropertyDescriptor): boolean;
    deleteProperty?(target: object, propertyKey: PropertyKey): boolean;
    get?(target: object, propertyKey: PropertyKey, receiver?: any): any;
    getOwnPropertyDescriptor?(target: object, propertyKey: PropertyKey): PropertyDescriptor | undefined;
    getPrototypeOf?(target: object): object;
    has?(target: object, propertyKey: PropertyKey): boolean;
    isExtensible?(target: object): boolean;
    ownKeys?(target: object): PropertyKey[];
    preventExtensions?(target: object): boolean;
    set?(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean;
    setPrototypeOf?(target: object, proto: any): boolean;
  }

  type Collection = Map<any, any> | WeakMap<any, any> | Set<any>  | WeakSet<any>

  interface CollectionHandlers {
    add?<Target extends Collection>(target: Target, value: any): Target;
    clear?(target: Collection): void;
    delete?(target: Collection, key: any): boolean;
    get?(target: Collection, key: any): any;
    has?(target: Collection, key: any): boolean;
    set?<Target extends Collection>(target: Target,key: any, value: any): Target;
    size?(target: Collection): number;
    forEach?(target: Collection,callbackfn: (value: any, key: any, map: Map<any, any>) => void, thisArg?: any): void;
    [Symbol.iterator]?(): IterableIterator<any>;
    entries?(): IterableIterator<[any, any]>;
    keys?(): IterableIterator<any>;
    values?(): IterableIterator<any>;
  }

  interface ReactionHandlers {
    transformReactions?(target: any, propertyKey: PropertyKey, reactions: [Function]): [Function]
  }


  interface ObservableOptions {
    proxyHandlers?: ProxyHandlers;
    collectionHandlers?: CollectionHandlers;
    reactionHandlers?: ReactionHandlers;
  }

  function observable<Observable extends object>(obj?: Observable, options?: ObservableOptions): Observable
  function isObservable(obj: object): boolean
  function raw<Observable extends object>(obj: Observable): Observable

  interface Scheduler {
    add: Function;
    delete: Function;
  }

  interface ObserveOptions {
    scheduler?: Scheduler | Function;
    debugger?: Function;
    lazy?: boolean;
  }

  function observe<Reaction extends Function>(func: Reaction, options?: ObserveOptions): Reaction
  function unobserve(func: Function): void
}
