# The observer utility

[![Build](https://img.shields.io/circleci/project/github/nx-js/observer-util/master.svg)](https://circleci.com/gh/nx-js/observer-util/tree/master) [![Coverage Status](https://coveralls.io/repos/github/nx-js/observer-util/badge.svg)](https://coveralls.io/github/nx-js/observer-util) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Package size](http://img.badgesize.io/https://unpkg.com/@nx-js/observer-util/dist/esm.es6.min.js?compression=gzip&label=minzip_size)](https://unpkg.com/@nx-js/observer-util/dist/esm.es6.js)  [![Version](https://img.shields.io/npm/v/@nx-js/observer-util.svg)](https://www.npmjs.com/package/@nx-js/observer-util) [![dependencies Status](https://david-dm.org/nx-js/observer-util/status.svg)](https://david-dm.org/nx-js/observer-util) [![License](https://img.shields.io/npm/l/@nx-js/observer-util.svg)](https://www.npmjs.com/package/@nx-js/observer-util)

Provides transparent reactivity without special syntax and with a **100% language observability** coverage. It uses **ES6 Proxies** internally to work seamlessly with a minimal interface.

This library is part of the [NX framework](https://nx-framework.com).

## Table of contents

- [Installation](#installation)  
- [Usage](#usage)
- [Features](#key-features)
- [API](#api)
- [Observer Timing](#observer-timing)
- [Platfrom Support](#platform-support)
- [Examples](#examples)
- [Contributing](#contributing)

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
import { observable, observe } from '@nx-js/observer-util'

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

Every observable object receives the `$raw` virtual property. It can be used to access the underlying non-observable object. Modifying and accessing the raw object doesn't trigger observers.

#### Using `$raw` for property access in observers

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable()
const logger = observe(() => console.log(person.age))

// this logs 'Bob'
person.name = 'Bob'

// this won't log anything
person.$raw.name = 'John'
```

#### Using `$raw` at observable mutations

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable({ age: 20 })
observe(() => console.log(`${person.name}: ${person.$raw.age}`))

// this logs 'Bob: 20'
person.name = 'Bob'

// this won't log anything
person.age = 33
```

### const promise = nextTick(fn)

Runs the passed callback after the queued observers run. It returns a Promise, which resolves after the observers run. This comes handy for testing.

```js
import { observable, observe, nextTick } from '@nx-js/observer-util'

let dummy
const counter = observable({num: 0})
observe(() => dummy = counter.num)

counter.num = 7
await nextTick()
// the observers ran during the tick, the 'dummy' is updated to be 7
expect(dummy).to.equal(7)
```

## Observer timing

Observer functions run once immediately when they are defined with `observe`.

After that, triggered observer functions do not run synchronously. Instead they are saved in a queue and executed in a batch after a small delay. This always happens before the next paint event in the browser.

Observers may trigger other observers by mutating observable objects. In this case the new observers are added to the end of the queue. Infinite loops are automatically resolved and duplicates are removed. This guarantees that observers run only once per batch. A stable and fresh state is always reached when the observer queue empties.

Non mutating operations on observables don't trigger observers. As an example the `observable.name = observable.name` set operation won't trigger observer functions.

## Platform support

- Node: 6 and above
- Chrome: 49 and above
- Firefox: 38 and above
- Safari: 10 and above
- Edge: 12 and above
- Opera: 36 and above
- IE is not supported

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

## Contributing

Contributions are always welcomed! Just send a PR for fixes and doc updates and open issues for new features beforehand. Make sure that the tests and the linter pass and that
the coverage remains high. Thanks!
