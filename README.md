# nx-observe

This library is part of the [NX framework](http://nx-framework.com).

The purpose of this library is to allow powerful data observation/binding without any special syntax.
It uses ES6 Proxies internally to create seamless data binding with a minimal interface.
A more detailed blog post about this library can be found
[here](https://blog.risingstack.com/writing-a-javascript-framework-data-binding-es6-proxy/).

## Installation

```
$ npm install @risingstack/nx-observe
```

## Platform support

- Node: 6 and above
- Chrome: 49 and above (after browserified)
- Firefox: 38 and above (after browserified)
- Safari: 10 and above (after browserified)
- Edge: 12 and above (after browserified)
- Opera: 36 and above (after browserified)
- IE is not supported

## Usage

```js
const observer = require('@risingstack/nx-observe')
```

## API

### observer.observable([Object])

This method creates and returns an observable object. If an object is passed as argument
it wraps the passed object in an observable.

```js
const observable = observer.observable({prop: 'someValue'})
```

### const signal = observer.observe(function, [context], ...[args])

This method observes a function. An observed function automatically reruns when a property of an
observable, which is used by the function changes (or is deleted). The function doesn't run
immediately on property change, instead it runs after a small delay (when the current stack empties).
Multiple synchronous changes won't cause the function to run multiple times.
The function can observe any synchronous javascript code (nested data, iterations, function calls,
getters/setters, etc.)

`observe()` returns a signal, which can later be used to stop the observation. This is similar to
the `const signal = setTimeout()`, `clearTimeout(signal)` pair.

```js
const signal = observer.observe(() => console.log(observable.prop))
```

A `this` context and a list of argument can be passed after the observed function as arguments.
In this case the observed function will always be called with the passed `this` context
and arguments.

```js
observer.observe(printSum, context, arg1, arg2)

function printSum (arg1, arg2) {
  console.log(arg1 + arg2)
}
```

### observer.unobserve(signal)

If the passed function is observed, it unobserves it. Unobserved functions won't be
rerun by observable changes anymore.

```js
const signal = observer.observe(() => console.log(observable.prop))
observer.unobserve(signal)
```

### observer.isObservable(Object)

Returns true if the passed object is an observable, otherwise returns false.

```js
const observable = observer.observable()
const isObservable = observer.isObservable(observable)
```

## Example

```js
const observer = require('@risingstack/nx-observe')

// creating two observable objects
const observable1 = observer.observable({num: 0})
const observable2 = observer.observable({num: 0})

// runs once synchronously, right away
// outputs 0 to the console
// the arguments are: observer func, observer func 'this' context, observer func arguments
const signal = observer.observe(printSum, undefined, observable1, observable2)

function printSum (obj1, obj2) {
  console.log(obj1.num + obj2.num)
}

// outputs 2 to the console
setTimeout(() => observable1.num = 2, 100)

// outputs 7 to the console
setTimeout(() => observable2.num = 5, 200)

// finish observing
setTimeout(() => observer.unobserve(signal), 300)

// observation is finished, doesn't trigger printSum, outputs nothing to the console
setTimeout(() => observable1.num = 6, 400)
```

## Features and edge cases

#### observable argument cases

If an observable is passed as argument to the observer.observable method, it simply returns the passed observable. If you pass the same object into different observer.observable calls, it always returns the same observable instance.

```js
const observer = require('@risingstack/nx-observe')

const obj = {prop: 'value'}
const observable1 = observer.observable(obj)
const observable2 = observer.observable(obj)
const observable3 = observer.observable(observable1)

// these output 'true' to the console
console.log(observable1 === observable2)
console.log(observable2 === observable3)
```

#### when does the observer run

An observer always runs once synchronously, right away. After that, the observer runs after every
stack in which the observable properties used by the observer are changed.
An observer runs maximum once per stack. Multiple changes of the observable
properties won't trigger it more than once.

```js
const observer = require('@risingstack/nx-observe')
const observable = observer.observable({prop: 'value'})

// runs once right away, outputs 'value' to the console
observer.observe(() => console.log(observable.prop))

// causes only 1 rerun, outputs 'newer value' to the console
setTimeout(() => {
  observable.prop = 'new value'
  observable.prop = 'newer value'
})
```

#### observing nested properties

Observing nested properties works with arbitrary depth.

```js
const observer = require('@risingstack/nx-observe')

const observable = observer.observable({prop: {nested: 'nestedValue'}})

// runs once after the current stack empties
// outputs 'nestedValue' to the console
observer.observe(() => console.log(observable.prop.nested))

// outputs 'otherValue' to the console
setTimeout(() => observable.prop.nested = 'otherValue', 100)
```

#### observing implicit properties

The library also observes implicit properties. Implicit properties are not directly used
by your code, but by native function implementations for example.

```js
const observer = require('@risingstack/nx-observe')

const observable = observer.observable({words: ['Hello', 'World']})

// runs once after the current stack empties
// outputs 'Hello World' to the console
observer.observe(() => console.log(observable.words.join(' ')))

// outputs 'Hello World !' to the console
setTimeout(() => observable.words.push('!'), 100)

// outputs 'Hello There !' to the console
setTimeout(() => observable.words.splice(1, 1, 'There'), 200)
```

#### observing inherited properties

You can use prototypal inheritance with observables.
The library walks and observes the prototype chain correctly.

```js
const observer = require('@risingstack/nx-observe')

const parentObservable = observer.observable({greeting: 'Hello'})
const observable = observer.observable({subject: 'World!'})

Object.setPrototypeOf(observable, parentObservable)

// runs once after the current stack empties
// outputs 'Hello World' to the console
observer.observe(() => console.log(observable.greeting + ' ' + observable.subject))

// outputs 'Hello There!' to the console
setTimeout(() => observable.subject = 'There!')

// outputs 'Hey There!' to the console
setTimeout(() => parentObservable.greeting = 'Hey', 100)

// outputs 'Look There!' to the console
setTimeout(() => observable.greeting = 'Look', 200)

// outputs 'Hey There!' to the console
setTimeout(() => delete observable.greeting, 300)
```

#### observing getters/setters

Computed getters/setter properties of observables will be correctly observed by observer functions.

```js
const observer = require('@risingstack/nx-observe')

const observable = observer.observable({
  num1: 0,
  num2: 0,
  get sum () { return this.num1 + this.num2 },
  set sum (value) {
    this.num1 = value / 2
    this.num2 = value / 2
  }
})

// outputs 0  to the console
observer.observe(() => console.log(observable.sum))

// outputs 1 to the console
setTimeout(() => observable.num1 = 1)

// outputs 4 to the console
setTimeout(() => observable.num2 = 3, 100)

// changes num1 and num2 to 3, outputs 6 the console
setTimeout(() => observable.sum = 6, 200)
```

#### two way binding

Every observed function is guaranteed to run maximum once per stack.
Asynchronous infinite loops are also handled and avoided by the library.

```js
const observer = require('@risingstack/nx-observe')

const observable1 = observer.observable({prop: 'value1'})
const observable2 = observer.observable({prop: 'value2'})

observer.observe(() => observable1.prop = observable2.prop)
observer.observe(() => observable2.prop = observable1.prop)

setTimeout(() => observable1.prop = 'Hello')
// outputs 'Hello' to the console
setTimeout(() => console.log(observable2.prop), 100)

setTimeout(() => observable2.prop = 'World', 200)
// outputs 'World' to the console
setTimeout(() => console.log(observable1.prop), 300)
```

#### selective observation

Sometimes you might want a certain set operation to not trigger observers, or a certain
observable property to not be observed by the observer function. In this case you should
use `observable.$raw`, which is the exposed raw (unwrapped) object behind the observable.
This object will not cause any observers to be triggered or registered.

```js
const observer = require('@risingstack/nx-observe')

const person = observer.observable({
  name: 'John',
  age: 25
})

// outputs 'name: John, age: 25' to the console
observer.observe(() => console.log(`name: ${person.name}, age: ${person.$raw.age}`))

// will not cause a rerun, since the observer only uses person.$raw.age
// outputs nothing to the console
setTimeout(() => person.age = 30)

// outputs 'name: Bill, age: 30' to the console
setTimeout(() => person.name = 'Bill', 100)

// will not cause a rerun, since it only modifies person.$raw
// outputs nothing to the console
setTimeout(() => person.$raw.name = 'Anne', 200)
```

## Performance

This [benchmark](/benchmark.js) compares vanilla JS, [MobX](http://mobxjs.github.io) and nx-observer
in a few scenarios. You can set it up locally with the `npm run build-benchmark-mac` or
`npm run build-benchmark-ubuntu` command (depending on your OS) and run it
with `npm run benchmark`. The result on a MacBook Pro with Node 6.2.0 can be seen below.

![Benchmark result](/benchmark.png)

- The first two tests compare NX and MobX observable creation cost with plain JS object creation.
In case of MobX the overhead grows with the number of properties.

- 'Dynamic property addition' tests the cost of adding expando properties to a plain object or an
observable without any observer/listener function registered for the observable.
MobX requires the special `mobx.extendObservable(obj, { prop: 'value' })` syntax
instead of `obj.prop = 'value'`.

- 'Get and set operation' test the cost of get/set operations of a plain object or an
observable without any observer/listener function registered for the observable.

- 'Function creation' tests the cost of vanilla JS function creation versus `mobx.autorun(newFn)`
and `nx.observe(newFn)`.

- 'Function trigger' tests the cost of registering observable property mutations
and running appropriate observer/listener functions.

- 'Function cleanup' tests the cost of disposing observer/listener functions with `disposeFn()`
or `nx.unobserve(fn)`.

Do not worry about the large difference between the vanilla and nx-observe / MobX results.
The operations tested above are some of the fastest ones in vanilla JS. The overhead would be a
lot smaller compared to some commonly used built in objects, like Promises.

## Contributions

This library has the very specific purpose of supporting the
[NX framework](https://github.com/RisingStack/nx-framework).
Features should only be added, if they are used by the framework. Otherwise please fork.

Bug fixes, tests, benchmark corrections and doc updates are always welcome.
Tests and linter (standardJS) must pass.

## Authors

  - [Miklos Bertalan](https://github.com/solkimicreb)

# License

  MIT
