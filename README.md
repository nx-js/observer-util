# nx-observe

This library is part of the [NX framework](http://nx-nxframework.rhcloud.com/).
The purpose of this library is to allow powerful data observation/binding without any special syntax.

## Installation

```
$ npm install @risingstack/nx-observe
```

## Platform support

- Node: 6 and above
- Chrome: 49 and above (after browserified)
- Firefox: 38 and above (after browserified)
- Safari: Technical Preview, 10 and above (after browserified)
- Edge: 12 and above (after browserified)
- Opera: 36 and above (after browserified)
- IE is not supported

## Usage

```js
const observer = require('@risingstack/nx-observe')
```

## API

### observer.observable([Object])

This method creates and returns an observable object. If an object is passed as argument it wraps the object in an observable.

```js
const observable = observer.observable({prop: 'someValue'})
```

### observer.observe(function)

This method observes a function. An observed function reruns every time a property of an observable, which is used by the function changes (or is deleted). The function doesn't run immediately on property change, it will run after the current stack empties. Multiple changes won't cause the function to run multiple times after the stack empties. The function can observe any synchronous javascript code (nested data, iterations, function calls, etc.)

```js
observer.observe(() => console.log(observable.prop))
```

### observer.unobserve(function)

If the passed function is observed it unobserves it. Unobserved functions won't be rerun by observable changes anymore.

```js
function noop () {}
observer.observe(noop)
observer.unobserve(noop)
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

const observable = observer.observable({prop: 'value'})

// runs once after the current stack empties
// outputs 'value' to the console
observer.observe(() => console.log(observable.prop))

// outputs 'Hello' to the console
setTimeout(() => observable.prop = 'Hello', 100)

// outputs 'World' to the console
setTimeout(() => observable.prop = 'World', 200)
```

## Features, limitations and edge cases

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

An observer always runs once after the stack it was defined in empties. After that the observer runs after every stack in which the observable properties used by the observer are changed. An observer runs maximum once per stack. Multiple changes of the observable properties won't trigger it more than once.

```js
const observer = require('@risingstack/nx-observe')

let dummy
const observable = observer.observable({prop: 'value'})
observer.observe(() => dummy = observable.prop)

// observer function didn't run yet
// outputs 'undefined' to the console
console.log(dummy)

// outputs 'value' to the console
setTimeout(() => console.log(dummy))
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

The library also observes implicit properties. Implicit properties are not directly used by your code, but by native function implementations for example.

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

#### two way binding

Every observed function is guaranteed to run maximum once per stack. Asynchronous infinite loops are also handled and avoided by the library.

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

#### observing inherited properties

You can use prototypal inheritance with observables. The library walks and observes the prototype chain correctly.

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

## Contributions

This library has the very specific purpose of supporting the [NX framework](https://github.com/RisingStack/nx-framework). Features should only be added, if they are used by the framework. Otherwise please fork.

Bug fixes, tests and doc updates are always welcome.
Tests and linter (standardJS) must pass.

## Authors

  - [Miklos Bertalan](https://github.com/solkimicreb)

# License

  MIT
