# The observer utility

This library is part of the [NX framework](https://nx-framework.com).

It provides transparent reactivity without special syntax and with a **100% language observability** coverage. It uses **ES6 Proxies** internally to work seamlessly with a minimal interface. A blog post about the inner working of this library can be found
[here](https://blog.risingstack.com/writing-a-javascript-framework-data-binding-es6-proxy/) and a comparison with MobX can be found [here](http://www.nx-framework.com/blog/public/mobx-vs-nx/).

## Installation

```
$ npm install @nx-js/observer-util
```

## Usage

```js
import { observable, observe } from '@nx-js/observer-util'

const data = observable({ firstName: 'Bob', lastName: 'Smith' })
observe(() => console.log(`${person.firstName} ${person.lastName}`))

// this logs 'John Smith' to the console
setTimeout(() =>  person.firstName = 'John')
```

## Key features

- Any synchronous JavaScript code can be observed - including expando properties, loops, getters/setters, inheritance and ES6 collections. Check out the [examples](#examples) section for more.

- No special syntax or setup is required, you will likely use the `observable` and `observe` functions only.

- Observable objects are not modified at all. Seamless proxies are used instead of getters/setters and array hacks. The underlying raw object can be easily retrieved and used when you don't want to trigger observers.

- You don't have to explicitly define observable properties. A minimal set of observable properties is automatically maintained based on the observer functions.

- Triggered observers run asynchronously, but always before the next repaint in browsers. Your data always reaches a stable and fresh state before repaints.

- Duplicates and loops are automatically removed from triggered observers. This ensures that your code won't run twice without a reason.

## Platform support

- Node: 6 and above
- Chrome: 49 and above
- Firefox: 38 and above
- Safari: 10 and above
- Edge: 12 and above
- Opera: 36 and above
- IE is not supported

## API

### const obj = observable([Object])

Creates and returns an observable object.

- If no argument is provided, it returns an empty observable.
- If an object is passed as argument it wraps the passed object in an observable.
- If an observable object is passed, it simply returns the passed observable object.

```js
import { observable } from '@nx-js/observer-util'

const person = observable({ name: 'Ann' })
```

### isObservable(Object)

Returns true if the passed object is an observable, otherwise returns false.

```js
import { observable, isObservable } from '@nx-js/observer-util'

const person = observable()
const isPersonObservable = isObservable(person)
```

### const fn = observe(function)

Creates and returns an observer function. An observer automatically reruns when a property of an observable - which is used by the observer - changes.

```js
import { observable, observer } from '@nx-js/observer-util'

const data = observable()

// this logs the data whenever it changes
const logger = observe(() => console.log(data))
```

### unobserve(fn)

Unobserves the passed observer function.

```js
import { observe, unobserve } from '@nx-js/observer-util'

const logger = observer.observe(() => console.log(observable.prop))
unobserve(logger)
```

### unqueue(fn)

Removes the the observer function from the queue of triggered observers. This means that the observer won't run, unless another observable mutation triggers it.

```js
import { observer, unqueue } from '@nx-js/observer-util'

const logger = observe(() => console.log(data))
unqueue(logger)
```

### exec(fn)

Immediately runs the observer function. Never run an observer function directly, use this method instead.

```js
import { observe, exec } from '@nx-js/observer-util'

const logger = observe(() => console.log(data))
exec(logger)
```

### observable.$raw

Every observable object receives the `$raw` virtual property. It can be used to access the underlying non-observable object. Modifying the raw object doesn't trigger observers.

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable()
const logger = observe(() => console.log(person.age))

// this logs 'Bob'
person.name = 'Bob'

// this won't log anything
person.$raw.name = 'John'
```

## Observer timing

Observer functions run once immediately when they are defined with `observe`.

After that, triggered observer functions do not run synchronously. Instead they are saved in a queue and executed in a batch after a small delay. This always happens before the next paint event in the browser.

Observers may trigger other observers by mutating observable objects. In this case the new observers are added to the end of the queue. Infinite loops are automatically resolved and duplicates are removed. This guarantees that observers run only once per batch. A stable and fresh state is always reached when the observer queue empties.

Non mutating operations on observables don't trigger observers. As an example the `observable.name = observable.name` set operation won't trigger observer functions.

## Examples

#### Observing expando properties

```js
import { observable, observe } from '@nx-js/observer-util'

const profile = observer.observable()
observe(() => console.log(profile.name))

// outputs 'Bob' to the console
setTimeout(() => profile.name = 'Bob', 100)
```

#### Observing conditionals

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable({
  gender: 'male',
  name: 'Potato'
})

observe(() => {
  if (person.gender === 'male') {
    console.log(`Mr. ${person.name}`)
  } else {
    console.log(`Ms. ${person.name}`)
  }
})

// logs 'Ms. Potato'
setTimeout(() => person.gender = 'female', 100)
```

#### Observing nested properties

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable({
  name: {
    first: 'John',
    last: 'Smith'
  },
  age: 22
})

//
observe(() => console.log(`${person.name.first} ${person.name.last}`))

// logs 'Bob Smith'
setTimeout(() => person.name.first = 'Bob', 100)
```

#### Observing native getters/setters

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observer.observable({
  firstName: 'Bob',
  lastName: 'Smith',
  get name () {
    return `${firstName} ${lastName}`
  }
})

observe(() => console.log(person.name))

// logs 'Ann Smith'
setTimeout(() => observable.firstName = 'Ann')
```

#### Observing arrays

```js
import { observable, observe } from '@nx-js/observer-util'

const users = observable([])

observe(() => console.log(users.join(', ')))

// logs 'Bob'
setTimeout(() => users.push('Bob'))

// logs 'Bob, John'
setTimeout(() => users.push('John'))

// logs 'Bob'
setTimeout(() => users.pop())
```

#### Observing ES6 collections

```js
import { observable, observe } from '@nx-js/observer-util'

const people = observable(new Map())

observe(() => {
  for (let [name, age] of people) {
    console.log(`${name}, ${age}`)
  }
})

// logs 'Bob, 22'
setTimeout(() => people.set('Bob', 22))

// logs 'Bob, 22' and 'John, 35'
setTimeout(() => people.set('John', 35))
```

#### Observing inherited properties

```js
import { observable, observe } from '@nx-js/observer-util'

const defaultUser = observable({
  name: 'Unknown',
  job: 'developer'
})
const user = observable(Object.create(defaultUser))

// logs 'Unknown is a developer'
observe(() => console.log(`${user.name} is a ${user.job}`))

// logs 'Bob is a developer'
setTimeout(() => user.name = 'Bob')

// logs 'Bob is a stylist'
setTimeout(() => user.job = 'stylist', 100)

// logs 'Unknown is a stylist'
setTimeout(() => delete user.name, 200)
```

## Performance

This [benchmark](/benchmark/benchmark.js) compares vanilla JS, [MobX](http://mobxjs.github.io) and nx-observe
in a few scenarios. You can set it up locally with the `npm run build-benchmark-mac` or
`npm run build-benchmark-ubuntu` command (depending on your OS) and run it
with `npm run benchmark`. The result on a MacBook Pro with Node 6.2.0 can be seen below.

![Benchmark result](/benchmark/benchmark.png)

- The first two tests compare NX and MobX observable creation cost with plain JS object creation.

- 'New property' tests the cost of adding expando properties to a plain object or an observable without any observer function. MobX requires the special `mobx.extendObservable(obj, { prop: 'value' })` syntax instead of `obj.prop = 'value'`.

- 'Get and set operation' tests the cost of get/set operations of a plain object or an observable without any observer function.

- 'Function creation' tests the cost of vanilla JS function creation versus `mobx.autorun(newFn)` and `nx.observe(newFn)`.

- 'Function trigger' tests the cost of intercepting observable property mutations and running the appropriate reactions. The 'no value change' test checks the same thing, in case of observable property mutations without a value change.

- 'Function cleanup' tests the cost of disposing observer/listener functions with `disposeFn()` or `signal.unobserve()`.

Do not worry about the large difference between the vanilla and nx-observe / MobX results.
The operations tested above are some of the fastest ones in vanilla JS. The overhead would be a
lot smaller compared to some commonly used built in objects, like Promises.

## Contributions

This library has the very specific purpose of supporting the
[NX framework](https://github.com/nx-js/framework).
Features should only be added, if they are used by the framework. Otherwise please fork.

Bug fixes, tests, benchmark corrections and doc updates are always welcome.
Tests and linter (standardJS) must pass.

## Authors

  - [Miklos Bertalan](https://github.com/solkimicreb)

# License

  MIT
