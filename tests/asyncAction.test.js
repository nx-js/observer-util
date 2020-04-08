import chaiAsPromised from 'chai-as-promised'
import chai from 'chai'
import { spy, __decorate } from './utils'
import { observe, observable, config, asyncAction } from 'nemo-observable-util'
import { DISABLE_WRITE_ERR } from '../src/action'
chai.use(chaiAsPromised)
const { expect } = chai

describe('asyncAction', () => {
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
  it('should throw when sync function', async () => {
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
      asyncAction(() => {
        counter.nested.num = 8
      })
    ).to.throw('asyncAction should must wrap on Async Function')
  })
  it('should end when sync throw', async () => {
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
      asyncAction(() => {
        throw new Error('xx')
      })
    ).to.throw('xx')
  })
  it('should support function wrapper', async () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const fn = spy(() => (dummy = counter.nested.num))
    observe(fn)

    expect(fn.callCount).to.equal(1)
    expect(dummy).to.equal(0)
    expect(() => {
      counter.nested.num = 8
    }).to.throw(DISABLE_WRITE_ERR)
    await expect(
      asyncAction(async () => {
        counter.nested.num = 8
      })()
    ).to.eventually.fulfilled
  })
  it('should support class method decorator', async () => {
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
      async bar () {
        counter.nested.num = 9
        return this.data
      }
    }
    __decorate([asyncAction], Foo.prototype, 'bar', null)
    const foo = new Foo()
    await expect(foo.bar()).to.eventually.fulfilled
    expect(foo.data).to.equal(456)
    expect(counter.nested.num).to.equal(9)
  })

  it('should support class attribute decorator', async () => {
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
      bar = async () => {
        counter.nested.num = 10
        return this.data
      };
    }
    __decorate([asyncAction], Foo.prototype, 'bar', undefined)
    const foo = new Foo()
    await expect(foo.bar()).to.eventually.fulfilled
    expect(foo.data).to.equal(123)
    expect(counter.nested.num).to.equal(10)
  })
})
