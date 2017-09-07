import { expect } from 'chai'
import { observable, isObservable } from '../src'

describe('observable', () => {
  it('should throw TypeError on invalid arguments', () => {
    expect(() => observable(12)).to.throw(TypeError)
    expect(() => observable('string')).to.throw(TypeError)
    expect(() => observable({})).to.not.throw(TypeError)
    expect(() => observable()).to.not.throw(TypeError)
  })

  it('should return a new observable when no argument is provided', () => {
    const obs = observable()
    expect(isObservable(obs)).to.be.true
  })

  it('should return an observable wrapping of an object argument', () => {
    const obj = {prop: 'value'}
    const obs = observable(obj)
    expect(obs).to.not.equal(obj)
    expect(isObservable(obs)).to.be.true
  })

  it('should return the argument if it is already an observable', () => {
    const obs1 = observable()
    const obs2 = observable(obs1)
    expect(obs1).to.equal(obs2)
  })

  it('should return the same observable wrapper when called repeatedly with the same argument', () => {
    const obj = {prop: 'value'}
    const obs1 = observable(obj)
    const obs2 = observable(obj)
    expect(obs1).to.equal(obs2)
  })

  it('should never let observables leak into the underlying raw object', () => {
    const obj = {}
    const obs = observable(obj)
    obj.nested1 = {}
    obs.nested2 = observable()
    expect(isObservable(obj.nested1)).to.be.false
    expect(isObservable(obj.nested2)).to.be.false
    expect(isObservable(obs.nested2)).to.be.true
  })
})
