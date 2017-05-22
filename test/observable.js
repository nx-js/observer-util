require('reify')

const expect = require('chai').expect
const observer = require('../src')

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
    expect(observer.isObservable(observable.nested2)).to.be.true
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
