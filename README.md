# The observer utility

[![Build](https://img.shields.io/circleci/project/github/nx-js/observer-util/master.svg)](https://circleci.com/gh/nx-js/observer-util/tree/master) [![Coverage Status](https://coveralls.io/repos/github/nx-js/observer-util/badge.svg)](https://coveralls.io/github/nx-js/observer-util) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Package size](http://img.badgesize.io/https://unpkg.com/@nx-js/observer-util/dist/umd.es6.min.js?compression=gzip&label=minzip_size)](https://unpkg.com/@nx-js/observer-util/dist/umd.es6.min.js)  [![Version](https://img.shields.io/npm/v/@nx-js/observer-util.svg)](https://www.npmjs.com/package/@nx-js/observer-util) [![dependencies Status](https://david-dm.org/nx-js/observer-util/status.svg)](https://david-dm.org/nx-js/observer-util) [![License](https://img.shields.io/npm/l/@nx-js/observer-util.svg)](https://www.npmjs.com/package/@nx-js/observer-util)

Transparent reactivity without special syntax and with a **100% language observability** coverage. It uses **ES6 Proxies** internally to work seamlessly with a minimal interface.

[React Easy State](https://github.com/solkimicreb/react-easy-state) is a React state management solution - based on this library. This library is part of the [NX framework](https://nx-framework.com).

<details>
<summary><strong>Table of Contents</strong></summary>
<!-- Do not edit the Table of Contents, instead regenerate with `npm run build-toc` -->

<!-- toc -->

* [Installation](#installation)
* [Usage](#usage)
* [Key features](#key-features)
* [Platform support](#platform-support)
* [API](#api)
  + [const object = observable(object)](#const-object--observableobject)
  + [const boolean = isObservable(object)](#const-boolean--isobservableobject)
  + [const function = observe(function)](#const-function--observefunction)
  + [unobserve(function)](#unobservefunction)
  + [unqueue(function)](#unqueuefunction)
  + [exec(function)](#execfunction)
  + [const promise = nextTick(function)](#const-promise--nexttickfunction)
  + [observable.$raw](#observableraw)
* [Examples](#examples)
* [Alternative builds](#alternative-builds)
* [Contributing](#contributing)

<!-- tocstop -->

</details>

## Installation

```
$ npm install @nx-js/observer-util
```

## Usage

This library has two main functions. `observable` turns the passed object into an observable object and `observe` turns the passed function into a reaction. A reaction is automatically executed whenever an observable property - which is used inside the reaction - changes value. Reactions are executed in an async batch, after a small delay.

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable({ firstName: 'Bob', lastName: 'Smith' })

// this reaction automatically re-runs whenever person.firstName or person.lastName changes
observe(() => console.log(`${person.firstName} ${person.lastName}`))

// this logs 'John Smith' to the console
setTimeout(() =>  person.firstName = 'John')
```

## Key features

- Any JavaScript code is correctly observed in reactions - including expando properties, loops, getters/setters, inheritance and ES6 collections. Check out the [examples](#examples) section for more.

- No special syntax or setup is required, you will likely use the `observable` and `observe` functions only.

- Observable objects are not modified at all. The underlying raw object can be easily retrieved and used when you don't want to trigger reactions.

- Triggered reactions run asynchronously, but always before the next repaint in browsers. Your reactions reach a stable and fresh state before repaints.

- Duplicates and loops are automatically removed from triggered reactions. This ensures that your code won't run twice without a reason.

## Platform support

- Node: 6.5 and above
- Chrome: 49 and above
- Firefox: 38 and above
- Safari: 10 and above
- Edge: 12 and above
- Opera: 36 and above
- IE is not supported

## API

### const object = observable(object)

Creates and returns an observable object.

- If no argument is provided, it returns an empty observable object.
- If an object is passed as argument, it wraps the passed object in an observable.
- If an observable object is passed, it simply returns the passed observable object.

```js
import { observable } from '@nx-js/observer-util'

const person = observable({ name: 'Ann' })
```

### const boolean = isObservable(object)

Returns true if the passed object is an observable, otherwise returns false.

```js
import { observable, isObservable } from '@nx-js/observer-util'

const person = observable()
const isPersonObservable = isObservable(person)
```

### const function = observe(function)

Turns the passed function into a reaction, then executes and returns it. A reaction automatically reruns when a property of an observable - which is used by the reaction - changes.

```js
import { observable, observe } from '@nx-js/observer-util'

const counter = observable({ num: 0 })

// this logs the value of counter.num whenever it changes
const logger = observe(() => console.log(counter.num))
```

### unobserve(function)

Unobserves the passed reaction. Unobserved reactions won't be automatically run anymore.

```js
import { observable,observe, unobserve } from '@nx-js/observer-util'

const counter = observable({ num: 0 })
const logger = observe(() => console.log(counter.num))

// after this counter.num won't be automatically logged on changes
unobserve(logger)
```

### unqueue(function)

Removes the the reaction function from the queue of triggered reactions. This means that the reaction won't run in the next batch, unless another observable mutation triggers it.

```js
import { observe, unqueue } from '@nx-js/observer-util'

const counter = observable({ num: 0 })
const logger = observe(() => console.log(counter.num))

// counter.num is changed and it queues the logger reaction
counter.num++

// this removes the logger reaction from the queue, so it won't run
unqueue(logger)
```

### exec(function)

Immediately runs the passed reaction. Never run a reaction directly, use this method instead. Running the reaction with a direct call may cause it to not discover observable property access in some of its parts.

```js
import { observable, observe, exec } from '@nx-js/observer-util'

const person = observable({ name: 'Bob' })
const logger = observe(() => console.log(person.name))
exec(logger)
```

### const promise = nextTick(function)

Runs the passed callback after the queued reactions run. It also returns a Promise, which resolves after the reactions. This comes handy for testing.

```js
import { observable, observe, nextTick } from '@nx-js/observer-util'

let dummy
const counter = observable({num: 0})
observe(() => dummy = counter.num)

counter.num = 7
await nextTick()
// the reactions ran during the tick, the 'dummy' is already updated to be 7
expect(dummy).to.equal(7)
```

### observable.$raw

Every observable object has a `$raw` virtual property. It can be used to access the underlying non-observable object. Modifying and accessing the raw object doesn't trigger reactions.

#### Using `$raw` for property access in reactions

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable()
const logger = observe(() => console.log(person.name))

// this logs 'Bob'
setTimeout(() => person.name = 'Bob')

// this won't log anything
setTimeout(() => person.$raw.name = 'John')
```

#### Using `$raw` at observable mutations

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable({ age: 20 })
observe(() => console.log(`${person.name}: ${person.$raw.age}`))

// this logs 'Bob: 20'
setTimeout(() => person.name = 'Bob')

// this won't log anything
setTimeout(() => person.age = 33)
```

## Examples

#### Observing expando properties

```js
import { observable, observe } from '@nx-js/observer-util'

const profile = observer.observable()
observe(() => console.log(profile.name))

// logs 'Bob'
setTimeout(() => profile.name = 'Bob')
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
setTimeout(() => person.gender = 'female')
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
setTimeout(() => person.name.first = 'Bob')
```

#### Observing native getters/setters

```js
import { observable, observe } from '@nx-js/observer-util'

const person = observable({
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
setTimeout(() => user.job = 'stylist')

// logs 'Unknown is a stylist'
setTimeout(() => delete user.name)
```

## Alternative builds

This library detects if you use ES6 or commonJS modules and serve the right format to you. The exposed bundles are transpiled to ES5 to support common tools - like UglifyJS minifying. If you would like a finer control over the provided build, you can specify them in your imports.

- `@nx-js/observer-util/dist/es.es6.js` exposes an ES6 build with ES6 modules.
- `@nx-js/observer-util/dist/es.es5.js` exposes an ES5 build with ES6 modules.
- `@nx-js/observer-util/dist/cjs.es6.js` exposes an ES6 build with commonJS modules.
- `@nx-js/observer-util/dist/cjs.es5.js` exposes an ES5 build with commonJS modules.

If you use a bundler, set up an alias for `@nx-js/observer-util` to point to your desired build. You can learn how to do it with webpack [here](https://webpack.js.org/configuration/resolve/#resolve-alias) and with rollup [here](https://github.com/rollup/rollup-plugin-alias#usage).

## Contributing

Contributions are always welcomed! Just send a PR for fixes and doc updates and open issues for new features beforehand. Make sure that the tests and the linter pass and that
the coverage remains high. Thanks!
