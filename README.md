# nx-observe

This library is part of the **nx framework**.
The purpose of this library is to allow powerful data observation/binding without any special syntax.

## Installation

```
$ TODO: add to npm
```

## Platform support

- Node: 6 and above
- Chrome: 49 and above (after browserified)
- Firefox: 18 and above (after browserified)
- Edge: 13 and above (after browserified)

## Usage

```js
const observer = require('nx-observe')
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
observer.observe(() => console.log(observable.someProp))
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
const observer = require('nx-observe')

let dummy
const observable = observer.observable({prop: 'value'})

observer.observe(() => dummy = observable.prop)

setTimeout(() => observable.prop = 'Hello')
// outputs 'Hello' to the console
setTimeout(() => console.log(dummy), 100)

setTimeout(() => observable.prop = 'World', 200)
// outputs 'World' to the console
setTimeout(() => console.log(dummy), 300)
```

## Features, limitations and edge cases

#### observer.observable argument behavior

If an observable is passed as argument to the observer.observable method it simply returns the passed observable. If you pass the same object into different observer.observable calls it always returns the same observable instance.

```js
const observer = require('nx-observe')

const obj = {prop: 'value'}
const observable1 = observer.observable(obj)
const observable2 = observer.observable(obj)
const observable3 = observer.observable(observable1)

// these output 'true' to the console
console.log(observable1 === observable2)
console.log(observable2 === observable3)
```

#### an observers always runs once, after the stack it was defined in empties

```js
const observer = require('nx-observe')

let dummy
const observable = observer.observable({prop: 'value'})
observer.observe(() => dummy = observable.prop)

// outputs 'value' to the console
setTimeout(() => console.log(dummy))
```

#### observing nested properties

Observing nested properties works with arbitrary depth.

```js
const observer = require('nx-observe')

let dummy
const observable = observer.observable({prop: {nested: 'nestedValue'}})
observer.observe(() => dummy = observable.prop.nested)

setTimeout(() => observable.nested.prop = 'otherValue')
// outputs 'otherValue' to the console
setTimeout(() => console.log(dummy), 100)
```

#### observing implicit properties

The library also observes implicit properties. Implicit properties are not directly used by your code, but by native function implementations for example.

```js
const observer = require('nx-observe')

let dummy
const observable = observer.observable({words: ['Hello', 'World']})
observer.observe(() => dummy = observable.words.join(' '))

setTimeout(() => observable.words.push('!'))
// outputs 'Hello World !' to the console
setTimeout(() => console.log(dummy), 100)

setTimeout(() => observable.words.splice(1, 1, 'There'), 200)
// outputs 'Hello There !' to the console
setTimeout(() => console.log(dummy), 300)
```

#### two way binding

Every observed function is guaranteed to run maximum once par stack. Asynchronous infinite loops are also handled and avoided by the library.

```js
const observer = require('nx-observe')

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
const observer = require('nx-observe')

let message
const parentObservable = observer.observable({greeting: 'Hello'})
const observable = observer.observable({subject: 'World!'})

Object.setPrototypeOf(observable, parentObservable)

observer.observe(() => message = observable.greeting + ' ' + observable.subject)

setTimeout(() => observable.subject = 'There!')
// outputs 'Hello There!' to the console
setTimeout(() => console.log(message), 100)

setTimeout(() => parentObservable.greeting = 'Hey', 200)
// outputs 'Hey There!' to the console
setTimeout(() => console.log(message), 300)

setTimeout(() => observable.greeting = 'Look', 400)
// outputs 'Look There!' to the console
setTimeout(() => console.log(message), 500)

setTimeout(() => delete observable.greeting, 600)
// outputs 'Hey There!' to the console
setTimeout(() => console.log(message), 700)
```

## Contributions

This library has the very specific purpose of supporting the nx framework. Features should only be added, if they are used by the framework. Otherwise please fork.

Bug fixes, tests and doc updates are always welcome.
Tests and linter (standardJS) must pass.

## Authors

  - [Miklos Bertalan](https://github.com/solkimicreb)

# License

  MIT
