# nx-compile

This library is part of the **nx framework**.
The purpose of this library is to

## Installation

```
$ TODO: add to npm
```

## Usage

```js
const observer = require('nx-observe')
```

## API

### observer.observable([Object])

This method creates and returns an observable object. If an object is passed as argument it wraps the object in an observable and returns the observable. If an observable is passed as argument it returns the observable.

```js
const observable = observer.observable({prop: 'someValue'})
```

### observer.observe(function)

This method observes a function. An observed function will rerun every time a property of an observable which is used by the function changes. The function doesn't run immediately on property change, it will run after the current stack empties. The function will also run in case the property of the observable is set to the same value it had before.

```js
observer.observe(() => console.log(observable.someProp))
```

### observer.unobserve(function)

If the passed function is observed it will unobserve it. Unobserved functions won't rerun on observable changes anymore. If the passed function is not an observed one it will do nothing.

```js
function noop () {}
observer.observe(noop)
observer.unobserve(noop)
```

### observer.isObservable(Object)

Returns true if the passed object is an observable (created by observer.observable). Otherwise returns false.

```js
const observable = observer.observable()
observer.isObservable(observable)
```

## Example

```js
const observer = require('nx-observe')

const observable1 = observer.observable({
  nested: {
    prop1: 'hello',
    prop2: 'world'
  }
})
const observable2 = observer.observable({
  list: ['there', 'nice']
})

observer.observe(() => console.log(observable1.nested.prop1 + observable2.list[0]))

observable1.nested.prop1 = 'hi'
observable2.list[0] += '!'
// will log 'hi there!' on the console once, after the current stack empties

setTimeout(() => {
  observable1.nested.prop1 = 'check this '
  observable2.list[0] = 'out!'
}, 1000)
// will log 'check this out!' on console once, after 1 sec (when that stack empties)
```

## Features and limitations

A function passed to observer.observe can correctly observe any synchronous javascript code (you can do conditionals, loops or call other functions too). It however won't observe asynchronous operations.

Observed functions will run after the current stack empties. This allows for many optimization.
- changing many observable properties used by the function won't cause it to run more than once
- observed function won't cause infinite loops, you can safely do the following
```js
// this keeps observable1.prop1 and observable2.prop1 in sync
observer.observe(() => observable1.prop1 = observable2.prop1)
observer.observe(() => observable2.prop1 = observable1.prop1)
```

## Authors

  - [Miklos Bertalan](https://github.com/solkimicreb)

# License

  MIT
