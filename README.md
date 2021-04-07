# The Observer Utility

Transparent reactivity with 100% language coverage. Made with :heart: and ES6 Proxies.

[![Build](https://img.shields.io/circleci/project/github/nx-js/observer-util/master.svg)](https://circleci.com/gh/nx-js/observer-util/tree/master) [![Coverage Status](https://coveralls.io/repos/github/nx-js/observer-util/badge.svg)](https://coveralls.io/github/nx-js/observer-util) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Package size](https://img.shields.io/bundlephobia/minzip/@nx-js/observer-util.svg)](https://bundlephobia.com/result?p=@nx-js/observer-util) [![Version](https://img.shields.io/npm/v/@nx-js/observer-util.svg)](https://www.npmjs.com/package/@nx-js/observer-util) [![dependencies Status](https://david-dm.org/nx-js/observer-util/status.svg)](https://david-dm.org/nx-js/observer-util) [![License](https://img.shields.io/npm/l/@nx-js/observer-util.svg)](https://www.npmjs.com/package/@nx-js/observer-util)

<details>
<summary><strong>Table of Contents</strong></summary>
<!-- Do not edit the Table of Contents, instead regenerate with `npm run build-toc` -->

<!-- toc -->

* [Motivation](#motivation)
* [Bindings](#bindings)
* [Installation](#installation)
* [Usage](#usage)
  * [Observables](#observables)
  * [Reactions](#reactions)
  * [Reaction scheduling](#reaction-scheduling)
* [API](#api)
  * [Proxy = observable(object)](#proxy--observableobject)
  * [boolean = isObservable(object)](#boolean--isobservableobject)
  * [reaction = observe(function, config)](#reaction--observefunction-config)
  * [unobserve(reaction)](#unobservereaction)
  * [obj = raw(observable)](#obj--rawobservable)
* [Platform support](#platform-support)
* [Contributing](#contributing)

<!-- tocstop -->

</details>

## Motivation

Popular frontend frameworks - like Angular, React and Vue - use a reactivity system to automatically update the view when the state changes. This is necessary for creating modern web apps and staying sane at the same time.

The Observer Utililty is a similar reactivity system, with a modern twist. It uses [ES6 Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to achieve true transparency and a 100% language coverage. Ideally you would like to manage your state with plain JS code and expect the view to update where needed. In practice some reactivity systems require extra syntax - like React's `setState`. Others have limits on the language features, which they can react on - like dynamic properties or the `delete` keyword. These are small nuisances, but they lead to long hours lost among special docs and related issues.

The Observer Utility aims to eradicate these edge cases. It comes with a tiny learning curve and with a promise that you won't have to dig up hidden docs and issues later. Give it a try, things will just work.

## Bindings

This is a framework independent library, which powers the reactivity system behind other state management solutions. These are the currently available bindings.

* [React Easy State](https://github.com/solkimicreb/react-easy-state) is a state management solution for React with a minimal learning curve.
* [preact-ns-observer](https://github.com/mseddon/preact-nx-observer) provides a simple `@observable` decorator that makes Preact components reactive.

## Installation

```
$ npm install @nx-js/observer-util
```

## Usage

The two building blocks of reactivity are **observables** and **reactions**. Observable objects represent the state and reactions are functions, that react to state changes. In case of transparent reactivity, these reactions are called automatically on relevant state changes.

### Observables

Observables are transparent Proxies, which can be created with the `observable` function. From the outside they behave exactly like plain JS objects.

```js
import { observable } from '@nx-js/observer-util';

const counter = observable({ num: 0 });

// observables behave like plain JS objects
counter.num = 12;
```

### Reactions

Reactions are functions, which use observables. They can be created with the `observe` function and they are automatically executed whenever the observables - used by them - change.

#### Vanilla JavaScript

```js
import { observable, observe } from '@nx-js/observer-util';

const counter = observable({ num: 0 });
const countLogger = observe(() => console.log(counter.num));

// this calls countLogger and logs 1
counter.num++;
```

#### React Component

```js
import { store, view } from 'react-easy-state';

// this is an observable store
const counter = store({
  num: 0,
  up() {
    this.num++;
  }
});

// this is a reactive component, which re-renders whenever counter.num changes
const UserComp = view(() => <div onClick={counter.up}>{counter.num}</div>);
```

#### Preact Component
```js
import { observer } from "preact-nx-observer";

let store = observable({ title: "This is foo's data"});

@observer // Component will now re-render whenever store.title changes.
class Foo extends Component {
  render() {
    return <h1>{store.title}</h1>
  }
}
```
#### More examples

<details>
<summary>Dynamic properties</summary>

```js
import { observable, observe } from '@nx-js/observer-util';

const profile = observable();
observe(() => console.log(profile.name));

// logs 'Bob'
profile.name = 'Bob';
```

</details>
<details>
<summary>Nested properties</summary>

```js
import { observable, observe } from '@nx-js/observer-util';

const person = observable({
  name: {
    first: 'John',
    last: 'Smith'
  },
  age: 22
});

observe(() => console.log(`${person.name.first} ${person.name.last}`));

// logs 'Bob Smith'
person.name.first = 'Bob';
```

</details>
<details>
<summary>Getter properties</summary>

```js
import { observable, observe } from '@nx-js/observer-util';

const person = observable({
  firstName: 'Bob',
  lastName: 'Smith',
  get name() {
    return `${this.firstName} ${this.lastName}`;
  }
});

observe(() => console.log(person.name));

// logs 'Ann Smith'
person.firstName = 'Ann';
```

</details>
<details>
<summary>Conditionals</summary>

```js
import { observable, observe } from '@nx-js/observer-util';

const person = observable({
  gender: 'male',
  name: 'Potato'
});

observe(() => {
  if (person.gender === 'male') {
    console.log(`Mr. ${person.name}`);
  } else {
    console.log(`Ms. ${person.name}`);
  }
});

// logs 'Ms. Potato'
person.gender = 'female';
```

</details>
<details>
<summary>Arrays</summary>

```js
import { observable, observe } from '@nx-js/observer-util';

const users = observable([]);

observe(() => console.log(users.join(', ')));

// logs 'Bob'
users.push('Bob');

// logs 'Bob, John'
users.push('John');

// logs 'Bob'
users.pop();
```

</details>
<details>
<summary>ES6 collections</summary>

```js
import { observable, observe } from '@nx-js/observer-util';

const people = observable(new Map());

observe(() => {
  for (let [name, age] of people) {
    console.log(`${name}, ${age}`);
  }
});

// logs 'Bob, 22'
people.set('Bob', 22);

// logs 'Bob, 22' and 'John, 35'
people.set('John', 35);
```

</details>
<details>
<summary>Inherited properties</summary>

```js
import { observable, observe } from '@nx-js/observer-util';

const defaultUser = observable({
  name: 'Unknown',
  job: 'developer'
});
const user = observable(Object.create(defaultUser));

// logs 'Unknown is a developer'
observe(() => console.log(`${user.name} is a ${user.job}`));

// logs 'Bob is a developer'
user.name = 'Bob';

// logs 'Bob is a stylist'
user.job = 'stylist';

// logs 'Unknown is a stylist'
delete user.name;
```

</details>

### Reaction scheduling

Reactions are scheduled to run whenever the relevant observable state changes. The default scheduler runs the reactions synchronously, but custom schedulers can be passed to change this behavior. Schedulers are usually functions which receive the scheduled reaction as argument.

```js
import { observable, observe } from '@nx-js/observer-util';

// this scheduler delays reactions by 1 second
const scheduler = reaction => setTimeout(reaction, 1000);

const person = observable({ name: 'Josh' });
observe(() => console.log(person.name), { scheduler });

// this logs 'Barbie' after a one second delay
person.name = 'Barbie';
```

Alternatively schedulers can be objects with an `add` and `delete` method. Check out the below examples for more.

#### More examples

<details>
<summary>React Scheduler</summary>

The React scheduler simply calls `setState` on relevant observable changes. This delegates the render scheduling to React Fiber. It works roughly like this.

```js
import { observe } from '@nx-js/observer-util';

class ReactiveComp extends BaseComp {
  constructor() {
    // ...
    this.render = observe(this.render, {
      scheduler: () => this.setState()
    });
  }
}
```

</details>
<details>
<summary>Batched updates with ES6 Sets</summary>

Schedulers can be objects with an `add` and `delete` method, which schedule and unschedule reactions. ES6 Sets can be used as a scheduler, that automatically removes duplicate reactions.

```js
import { observable, observe } from '@nx-js/observer-util';

const reactions = new Set();
const person = observable({ name: 'Josh' });
observe(() => console.log(person), { scheduler: reactions });

// this throttles reactions to run with a minimal 1 second interval
setInterval(() => {
  reactions.forEach(reaction => reaction());
}, 1000);

// these will cause { name: 'Barbie', age: 30 } to be logged once
person.name = 'Barbie';
person.age = 87;
```

</details>
<details>
<summary>Batched updates with queues</summary>

Queues from the [Queue Util](https://github.com/nx-js/queue-util) can be used to implement complex scheduling patterns by combining automatic priority based and manual execution.

```js
import { observable, observe } from '@nx-js/observer-util';
import { Queue, priorities } from '@nx-js/queue-util';

const scheduler = new Queue(priorities.LOW);
const person = observable({ name: 'Josh' });
observe(() => console.log(person), { scheduler });

// these will cause { name: 'Barbie', age: 30 } to be logged once
// when everything is idle and there is free time to do it
person.name = 'Barbie';
person.age = 87;
```

Queues are automatically scheduling reactions - based on their priority - but they can also be stopped, started and cleared manually at any time.

</details>

## API

### Proxy = observable(object)

Creates and returns a proxied observable object, which behaves just like the originally passed object. The original object is **not modified**.

* If no argument is provided, it returns an empty observable object.
* If an object is passed as argument, it wraps the passed object in an observable.
* If an observable object is passed, it returns the passed observable object.

### boolean = isObservable(object)

Returns true if the passed object is an observable, returns false otherwise.

### reaction = observe(function, config)

Wraps the passed function with a reaction, which behaves just like the original function. The reaction is automatically scheduled to run whenever an observable - used by it - changes. The original function is **not modified**.

`observe` also accepts an optional config object with the following options.

* `lazy`: A boolean, which controls if the reaction is executed when it is created or not. If it is true, the reaction has to be called once manually to trigger the reactivity process. Defaults to false.

* `scheduler`: A function, which is called with the reaction when it is scheduled to run. It can also be an object with an `add` and `delete` method - which schedule and unschedule reactions. The default scheduler runs the reaction synchronously on observable mutations. You can learn more about reaction scheduling in the [related docs section](#reaction-scheduling).

* `debugger`: An optional function. It is called with contextual metadata object on basic operations - like set, get, delete, etc. The metadata object can be used to determine why the operation wired or scheduled the reaction and it always has enough data to reverse the operation. The debugger is always called before the scheduler.

### unobserve(reaction)

Unobserves the passed reaction. Unobserved reactions won't be automatically run anymore.

```js
import { observable, observe, unobserve } from '@nx-js/observer-util';

const counter = observable({ num: 0 });
const logger = observe(() => console.log(counter.num));

// after this the logger won't be automatically called on counter.num changes
unobserve(logger);
```

### obj = raw(observable)

Original objects are never modified, but transparently wrapped by observable proxies. `raw` can access the original non-reactive object. Modifying and accessing properties on the raw object doesn't trigger reactions.

#### Using `raw` at property access

```js
import { observable, observe, raw } from '@nx-js/observer-util';

const person = observable();
const logger = observe(() => console.log(person.name));

// this logs 'Bob'
person.name = 'Bob';

// `name` is used from the raw non-reactive object, this won't log anything
raw(person).name = 'John';
```

#### Using `raw` at property mutation

```js
import { observable, observe, raw } from '@nx-js/observer-util';

const person = observable({ age: 20 });
observe(() => console.log(`${person.name}: ${raw(person).age}`));

// this logs 'Bob: 20'
person.name = 'Bob';

// `age` is used from the raw non-reactive object, this won't log anything
person.age = 33;
```

## Platform support

* Node: 6.5 and above
* Chrome: 49 and above
* Firefox: 38 and above
* Safari: 10 and above
* Edge: 12 and above
* Opera: 36 and above
* IE is not supported

## Contributing

Contributions are always welcomed! Just send a PR for fixes and doc updates and open issues for new features beforehand. Make sure that the tests and the linter pass and that
the coverage remains high. Thanks!
