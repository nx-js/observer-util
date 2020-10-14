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
      counter.nested.num = 7
    }).to.throw(DISABLE_WRITE_ERR)
    const reaction1 = action(() => {
      counter.nested.num = 8
    })
    expect(reaction1).to.not.throw()
    const reaction2 = action('customName1')(() => {
      counter.nested.num = 9
    })
    expect(reaction2.name).to.equal('customName1')
    expect(reaction2).to.not.throw()
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

      baz () {
        counter.nested.num = 9
        return this.data
      }
    }
    __decorate([action], Foo.prototype, 'bar', null)
    __decorate([action('customName2')], Foo.prototype, 'baz', null)
    const foo = new Foo()
    expect(() => foo.bar()).to.not.throw()
    expect(foo.bar()).to.equal(456)
    expect(counter.nested.num).to.equal(8)
    expect(() => foo.baz()).to.not.throw()
    expect(foo.baz.name).to.equal('customName2')
    expect(foo.baz()).to.equal(456)
    expect(counter.nested.num).to.equal(9)
  })

  it('should support setter & getter', () => {
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
        counter.nested.num = 9999991
        this._data = v
      },
      enumerable: true,
      configurable: true
    })
    Object.defineProperty(Foo.prototype, 'baz', {
      get: function () {
        return this._data
      },
      set: function (v) {
        counter.nested.num = 9999993
        this._data = v
      },
      enumerable: true,
      configurable: true
    })
    __decorate([action], Foo.prototype, 'bar', null)
    __decorate([action('customName3')], Foo.prototype, 'baz', null)
    const foo = new Foo()
    expect(() => (foo.bar = 900)).to.not.throw()
    expect(foo.bar).to.equal(900)
    expect(counter.nested.num).to.equal(9999991)

    expect(
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(foo), 'baz').set
        .name
    ).to.equal('customName3')
    expect(
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(foo), 'baz').get
        .name
    ).to.equal('customName3')
    expect(() => (foo.baz = 400)).to.not.throw()
    expect(foo.baz).to.equal(400)
    expect(counter.nested.num).to.equal(9999993)
  })

  it('should support only getter', () => {
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
        this._data = 0
        counter.nested.num = 9999991
        return this._data
      },
      enumerable: true,
      configurable: true
    })
    __decorate([action], Foo.prototype, 'bar', null)
    const foo = new Foo()
    expect(foo.bar).to.equal(0)
    expect(counter.nested.num).to.equal(9999991)
  })

  it('should throw when setter & BaseModel without action', () => {
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
        counter.nested.num = 9999991
        this._data = v
      },
      enumerable: true,
      configurable: true
    })
    const foo = observable(new Foo())
    expect(() => (foo.bar = 900)).to.throw(DISABLE_WRITE_ERR)
  })

  it('should support setter & BaseModel', () => {
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
        counter.nested.num = 9999991
        this._data = v
      },
      enumerable: true,
      configurable: true
    })
    __decorate([action], Foo.prototype, 'bar', null)
    const foo = observable(new Foo())
    expect(() => (foo.bar = 900)).to.not.throw()
    expect(foo.bar).to.equal(900)
    expect(counter.nested.num).to.equal(9999991)
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

      baz = () => {
        counter.nested.num = 9
        return this.data
      };
    }
    __decorate([action], Foo.prototype, 'bar', undefined)
    __decorate([action('customName4')], Foo.prototype, 'baz', undefined)
    const foo = new Foo()
    expect(() => foo.bar()).to.not.throw()
    expect(foo.bar()).to.equal(123)

    expect(foo.baz.name).to.equal('customName4')
    expect(() => foo.baz()).to.not.throw()
    expect(foo.baz()).to.equal(123)
  })
})
