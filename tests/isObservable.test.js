import { expect } from 'chai'
import { observable, isObservable } from '../src'

describe('isObservable', () => {
  it('should throw a TypeError on invalid arguments', () => {
    expect(() => isObservable(12)).to.throw(TypeError)
    expect(() => isObservable('string')).to.throw(TypeError)
    expect(() => isObservable()).to.throw(TypeError)
    expect(() => isObservable({})).to.not.throw(TypeError)
  })

  it('should return true if an observable is passed as argument', () => {
    const obs = observable()
    const isObs = isObservable(obs)
    expect(isObs).to.equal(true)
  })

  it('should return false if a non observable is passed as argument', () => {
    const obj1 = { prop: 'value' }
    const obj2 = new Proxy({}, {})
    const isObs1 = isObservable(obj1)
    const isObs2 = isObservable(obj2)
    expect(isObs1).to.equal(false)
    expect(isObs2).to.equal(false)
  })
})
