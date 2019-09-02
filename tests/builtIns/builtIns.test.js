import chai from 'chai'
import { observable, isObservable } from 'nemo-observer-util'
const { expect } = chai

describe('none observable built-ins', () => {
  it('objects with global constructors should not be converted to observables', () => {
    window.MyClass = class MyClass {}
    const obj = new window.MyClass()
    const obs = observable(obj)
    expect(obs).to.equal(obj)
    expect(isObservable(obs)).to.equal(false)
  })

  it('objects with local constructors should be converted to observables', () => {
    class MyClass {}
    const obj = new MyClass()
    const obs = observable(obj)
    expect(obs).to.not.equal(obj)
    expect(isObservable(obs)).to.equal(true)
  })

  it('global objects should be converted to observables', () => {
    window.obj = {}
    const obs = observable(window.obj)
    expect(obs).to.not.equal(window.obj)
    expect(isObservable(obs)).to.equal(true)
  })

  it('Date should not be converted to observable', () => {
    const date = new Date()
    const obsDate = observable(date)
    expect(obsDate).to.equal(date)
    expect(isObservable(obsDate)).to.equal(false)
  })

  it('RegExp should not be converted to observable', () => {
    const regex = new RegExp()
    const obsRegex = observable(regex)
    expect(obsRegex).to.equal(regex)
    expect(isObservable(obsRegex)).to.equal(false)
  })

  it('Node should not be converted to observable', () => {
    const node = document
    const obsNode = observable(node)
    expect(obsNode).to.equal(node)
    expect(isObservable(obsNode)).to.equal(false)
  })

  it('WebAudio should not be converted to observable', () => {
    const audio = new AudioContext()
    const obsAudio = observable(audio)
    expect(obsAudio).to.equal(audio)
    expect(isObservable(obsAudio)).to.equal(false)
  })
})
