require('reify')

const expect = require('chai').expect
const observer = require('../src')

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
