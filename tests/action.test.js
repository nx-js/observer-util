import chai from 'chai'
import { spy, __decorate } from './utils'
import { observe, observable, config, action } from 'nemo-observable-util'
import { DISABLE_WRITE_ERR } from '../src/action'
const { expect } = chai

describe('action', () => {
  beforeEach(() => {
    config({
      onlyAllowChangeInAction: true
    })
  })
  afterEach(() => {
    config({
      onlyAllowChangeInAction: false
    })
  })
  it('should throw when not function', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const fn = spy(() => (dummy = counter.nested.num))
    observe(fn)

    expect(fn.callCount).to.equal(1)
    expect(dummy).to.equal(0)
    expect(() => {
      counter.nested.num = 8
    }).to.throw(DISABLE_WRITE_ERR)
    expect(() => action(1)).to.throw('action should must wrap on Function')
  })
  it('should support function wrapper', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const fn = spy(() => (dummy = counter.nested.num))
    observe(fn)

    expect(fn.callCount).to.equal(1)
    expect(dummy).to.equal(0)
    expect(() => {
      counter.nested.num = 8
    }).to.throw(DISABLE_WRITE_ERR)
    expect(
      action(() => {
        counter.nested.num = 8
      })
    ).to.not.throw()
  })
  it('should support class method decorator', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const fn = spy(() => (dummy = counter.nested.num))
    observe(fn)

    expect(fn.callCount).to.equal(1)
    expect(dummy).to.equal(0)
    expect(() => {
      counter.nested.num = 8
    }).to.throw(DISABLE_WRITE_ERR)
    class Foo {
      data = 456;
      bar () {
        counter.nested.num = 8
        return this.data
      }
    }
    __decorate([action], Foo.prototype, 'bar', null)
    const foo = new Foo()
    expect(() => foo.bar()).to.not.throw()
    expect(foo.bar()).to.equal(456)
  })

  it('should support setter', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const fn = spy(() => (dummy = counter.nested.num))
    observe(fn)

    expect(fn.callCount).to.equal(1)
    expect(dummy).to.equal(0)
    expect(() => {
      counter.nested.num = 8
    }).to.throw(DISABLE_WRITE_ERR)
    function Foo () {
      this._data = 456
    }
    Object.defineProperty(Foo.prototype, 'bar', {
      get: function () {
        return this._data
      },
      set: function (v) {
        this._data = v
      },
      enumerable: true,
      configurable: true
    })
    __decorate([action], Foo.prototype, 'bar', null)
    const foo = new Foo()
    expect(() => (foo.bar = 900)).to.not.throw()
    expect(foo.bar).to.equal(900)
  })

  it('should support class attribute decorator', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const fn = spy(() => (dummy = counter.nested.num))
    observe(fn)

    expect(fn.callCount).to.equal(1)
    expect(dummy).to.equal(0)
    expect(() => {
      counter.nested.num = 8
    }).to.throw(DISABLE_WRITE_ERR)
    class Foo {
      data = 123;
      bar = () => {
        counter.nested.num = 8
        return this.data
      };
    }
    __decorate([action], Foo.prototype, 'bar', undefined)
    const foo = new Foo()
    expect(() => foo.bar()).to.not.throw()
    expect(foo.bar()).to.equal(123)
  })
})
