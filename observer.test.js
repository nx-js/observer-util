'use strict'

const expect = require('chai').expect
const observer = require('./observer')

describe('nx-observe', () => {
  describe('observable', () => {
    it('should throw TypeError on invalid arguments', () => {
      expect(() => observer.observable(12)).to.throw(TypeError)
      expect(() => observer.observable('string')).to.throw(TypeError)
      expect(() => observer.observable({})).to.not.throw(TypeError)
      expect(() => observer.observable()).to.not.throw(TypeError)
    })

    it('should return a new observable when no argument is provided', () => {
      const observable = observer.observable()
      expect(observer.isObservable(observable)).to.be.true
    })

    it('should return an observable wrapping of an object argument', () => {
      const obj = {prop: 'value'}
      const observable = observer.observable(obj)
      expect(observable).to.not.equal(obj)
      expect(observer.isObservable(observable)).to.be.true
    })

    it('should return the argument if it is already an observable', () => {
      const observable1 = observer.observable()
      const observable2 = observer.observable(observable1)
      expect(observable1).to.equal(observable2)
    })

    it('should return the same observable wrapper when called repeatedly with the same argument', () => {
      const obj = {prop: 'value'}
      const observable1 = observer.observable(obj)
      const observable2 = observer.observable(obj)
      expect(observable1).to.equal(observable2)
    })

    it('should never modify the underlying plain object', () => {
      const obj = {}
      const observable = observer.observable(obj)
      obj.nested1 = {}
      observable.nested2 = observer.observable({})
      expect(observer.isObservable(obj.nested1)).to.be.false
      expect(observer.isObservable(obj.nested2)).to.be.false
    })
  })

  describe('isObservable', () => {
    it('should throw a TypeError on invalid arguments', () => {
      expect(() => observer.isObservable(12)).to.throw(TypeError)
      expect(() => observer.isObservable('string')).to.throw(TypeError)
      expect(() => observer.isObservable()).to.throw(TypeError)
      expect(() => observer.isObservable({})).to.not.throw(TypeError)
    })

    it('should return true if an observable is passed as argument', () => {
      const observable = observer.observable()
      const isObservable = observer.isObservable(observable)
      expect(isObservable).to.be.true
    })

    it('should return false if a non observable is passed as argument', () => {
      const obj1 = {prop: 'value'}
      const obj2 = new Proxy({}, {})
      const isObservable1 = observer.isObservable(obj1)
      const isObservable2 = observer.isObservable(obj2)
      expect(isObservable1).to.be.false
      expect(isObservable2).to.be.false
    })
  })

  describe('observe', () => {
    it('should throw TypeError on invalid arguments', () => {
      expect(() => observer.observe(12)).to.throw(TypeError)
      expect(() => observer.observe({})).to.throw(TypeError)
      expect(() => observer.observe()).to.throw(TypeError)
    })

    it('should observe basic properties', () => {
      let dummy
      const observable = observer.observable({counter: 0})
      observer.observe(() => dummy = observable.counter)

      return Promise.resolve()
        .then(() => observable.counter = 2)
        .then(() => expect(dummy).to.equal(2))
        .then(() => observable.counter = undefined)
        .then(() => expect(dummy).to.equal(undefined))
    })

    it('should observe nested properties', () => {
      let dummy
      const observable = observer.observable({nested: {counter: 0}})
      observer.observe(() => dummy = observable.nested.counter)

      return Promise.resolve()
        .then(() => observable.nested.counter = 2)
        .then(() => expect(dummy).to.equal(2))
        .then(() => observable.nested.counter = 'invalid')
        .then(() => expect(dummy).to.equal('invalid'))
    })

    it('should observe properties on the prototype chain', () => {
      let dummy
      const observable = observer.observable({counter: 0})
      const parentObservable = observer.observable({parentCounter: 2})
      Object.setPrototypeOf(observable, parentObservable)
      observer.observe(() => dummy = observable.counter + observable.parentCounter)

      return Promise.resolve()
        .then(() => observable.counter = 2)
        .then(() => expect(dummy).to.equal(4))
        .then(() => parentObservable.parentCounter = 3)
        .then(() => expect(dummy).to.equal(5))
    })

    it('should observe delete operations', () => {
      let dummy
      const observable = observer.observable({counter: 0})
      observer.observe(() => dummy = observable.counter)

      return Promise.resolve()
        .then(() => delete observable.counter)
        .then(() => expect(dummy).to.equal(undefined))
    })

    it('should not observe set operations without a value change', () => {
      let dummy
      const observable = observer.observable({prop: 'prop'})

      let numOfRuns = 0
      function test () {
        dummy = observable.prop
        numOfRuns++
      }
      observer.observe(test)

      return Promise.resolve()
        .then(() => observable.prop = 'prop')
        .then(() => observable.prop = 'prop')
        .then(() => observable.prop = 'prop')
        .then(() => expect(numOfRuns).to.equal(1))
        .then(() => expect(dummy).to.equal('prop'))
        .then(() => observable.prop = 'prop2')
        .then(() => observable.prop = 'prop2')
        .then(() => observable.prop = 'prop2')
        .then(() => expect(numOfRuns).to.equal(2))
        .then(() => expect(dummy).to.equal('prop2'))
    })

    it('should observe function call chains', () => {
      let dummy
      const observable = observer.observable({counter: 0})
      observer.observe(() => dummy = getCounter())

      function getCounter () {
        return observable.counter
      }

      return Promise.resolve()
        .then(() => observable.counter = 2)
        .then(() => expect(dummy).to.equal(2))
    })

    it('should observe implicit properties (iteration, etc)', () => {
      let dummy
      const observable = observer.observable({array: ['Hello']})
      observer.observe(() => dummy = observable.array.join(' '))

      function getCounter () {
        return observable.counter
      }

      return Promise.resolve()
        .then(() => observable.array.push('World!'))
        .then(() => expect(dummy).to.equal('Hello World!'))
        .then(() => observable.array.shift())
        .then(() => expect(dummy).to.equal('World!'))
    })

    it('should observe implicit properties (iteration, etc) Set', () => {
      let dummy
      const observable = observer.observable({set: new Set()})
      observer.observe(() => {
        //console.log(observable.set.has('World!'))
        observable.set.forEach((item) => console.log(item))
      })

      return Promise.resolve()
        .then(() => observable.set.add('Hello'))
        .then(() => observable.set.add('Beautiful'))
        .then(() => observable.set.$raw.add('World!'))
    })

    it('should observe implicit properties (iteration, etc) Map', () => {
      let dummy
      const observable = observer.observable({map: new Map()})
      observer.observe(() => {
        console.log(observable.map.get(3))
        // observable.map.forEach((item) => console.log(item))
      })

      return Promise.resolve()
        .then(() => observable.map.set(3, 'thingy!'))
        .then(() => observable.map.set(1, 'Hello'))
        .then(() => observable.map.set(2, 'Beautiful'))
        .then(() => observable.map.set(3, 'World!'))
    })

    it('should not observe well-known symbols', () => {
      let dummy
      const observable = observer.observable({[Symbol.toStringTag]: 'myString'})
      observer.observe(() => dummy = String(observable))

      return Promise.resolve()
        .then(() => expect(dummy).to.equal('[object myString]'))
        .then(() => observable[Symbol.toStringTag] = 'otherString')
        .then(() => expect(dummy).to.equal('[object myString]'))
    })

    it('should run once (synchronously) rigth away', () => {
      let dummy
      const observable = observer.observable({prop1: 'value1', prop2: 'value2'})

      let numOfRuns = 0
      function test () {
        dummy = observable.prop1 + observable.prop2
        numOfRuns++
      }
      observer.observe(test)
      expect(numOfRuns).to.equal(1)
    })

    it('should rerun maximum once per stack', () => {
      let dummy
      const observable = observer.observable({prop1: 'value1', prop2: 'value2'})

      let numOfRuns = 0
      function test () {
        dummy = observable.prop1 + observable.prop2
        numOfRuns++
      }
      observer.observe(test)

      return Promise.resolve()
        .then(() => {
          observable.prop1 = 1
          observable.prop2 = 3
          observable.prop1 = 0
        })
        .then(() => expect(numOfRuns).to.equal(2))
    })

    it('should avoid infinite loops', () => {
      const observable1 = observer.observable({prop: 'value1'})
      const observable2 = observer.observable({prop: 'value2'})

      let numOfRuns1 = 0
      let numOfRuns2 = 0
      function test1 () {
        observable1.prop = observable2.prop
        numOfRuns1++
      }
      function test2 () {
        observable2.prop = observable1.prop
        numOfRuns2++
      }
      observer.observe(test1)
      observer.observe(test2)

      return Promise.resolve()
        .then(() => observable1.prop = 'Hello')
        .then(() => expect(observable2.prop).to.equal('Hello'))
        .then(() => observable2.prop = 'World!')
        .then(() => expect(observable1.prop).to.equal('World!'))
        .then(() => {
          expect(numOfRuns1).to.equal(3)
          expect(numOfRuns2).to.equal(3)
        })
    })

    it('should accept a context argument and set the observer "this" to it', () => {
      let dummy
      const observable = observer.observable({counter: 0})
      observer.observe(setDummy, observable)

      function setDummy () {
        dummy = this.counter
      }

      return Promise.resolve()
        .then(() => observable.counter = 2)
        .then(() => expect(dummy).to.equal(2))
        .then(() => observable.counter = undefined)
        .then(() => expect(dummy).to.equal(undefined))
    })

    it('should accept a list of arguments and set the observer arguments to them', () => {
      let dummy
      const observable1 = observer.observable({counter: 0})
      const observable2 = observer.observable({counter: 0})
      observer.observe(setDummy, undefined, observable1, observable2)

      function setDummy (state1, state2) {
        dummy = state1.counter + state2.counter
      }

      return Promise.resolve()
        .then(() => observable1.counter = 2)
        .then(() => expect(dummy).to.equal(2))
        .then(() => observable2.counter = 1)
        .then(() => expect(dummy).to.equal(3))
    })

    it('should return an unobserve (object) signal', () => {
      let dummy
      const observable = observer.observable({counter: 0})
      const signal = observer.observe(() => dummy = observable.counter)
      expect(signal).to.be.an('object')
    })
  })

  describe('unobserve', () => {
    it('should unobserve the observed function', () => {
      let dummy
      const observable = observer.observable({prop: 0})

      let numOfRuns = 0
      function test() {
        dummy = observable.prop
        numOfRuns++
      }
      const signal = observer.observe(test)

      return Promise.resolve()
        .then(() => observable.prop = 'Hello')
        .then(() => observer.unobserve(signal))
        .then(() => observable.prop = 'World')
        .then(() => observable.prop = '!')
        .then(() => expect(numOfRuns).to.equal(2))
    })

    it('should unobserve even if the function is registered for the stack', () => {
      let dummy
      const observable = observer.observable({prop: 0})

      let numOfRuns = 0
      function test() {
        dummy = observable.prop
        numOfRuns++
      }
      const signal = observer.observe(test)

      return Promise.resolve()
        .then(() => {
          observable.prop = 2
          observer.unobserve(signal)
        })
        .then(() => expect(numOfRuns).to.equal(1))
    })
  })
})
