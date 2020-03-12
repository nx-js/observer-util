import chai from 'chai'
import { spy, __decorate } from './utils'
import {
  observe,
  observable,
  startTransaction,
  endTransaction,
  withTransaction
} from 'nemo-observable-util'
import { transactionManager } from '../src/transaction'
const { expect } = chai

describe('transaction', () => {
  it('should support transaction', () => {
    let dummy
    const counter = observable({ nested: { num: 0 } })
    const fn = spy(() => (dummy = counter.nested.num))
    observe(fn)

    expect(fn.callCount).to.equal(1)
    expect(dummy).to.equal(0)
    counter.nested.num = 8
    expect(fn.callCount).to.equal(2)
    expect(dummy).to.equal(8)

    startTransaction(this)
    counter.nested.num = 9
    expect(fn.callCount).to.equal(2)
    expect(dummy).to.equal(8)
    counter.nested.num = 10
    expect(fn.callCount).to.equal(2)
    expect(dummy).to.equal(8)
    counter.nested.num = 11
    expect(fn.callCount).to.equal(2)
    expect(dummy).to.equal(8)
    endTransaction(this)
    expect(fn.callCount).to.equal(3)
    expect(dummy).to.equal(11)
  })

  it('should support nested transaction', () => {
    const model = observable({
      user: {
        firstName: 'j',
        lastName: 'k'
      }
    })
    const fn1 = spy(() => {
      startTransaction('phase1')
      model.user.firstName = 'j1'
      model.user.firstName = 'j2'
      fn2()
      endTransaction('phase1')
    })
    const fn2 = spy(() => {
      startTransaction('phase2')
      model.user.lastName = 'k1'
      model.user.lastName = 'k2'
      endTransaction('phase2')
    })
    let dummy
    const fn3 = spy(() => {
      dummy = model.user.firstName + model.user.lastName
    })
    observe(fn3)
    expect(fn3.callCount).to.equal(1)
    expect(dummy).to.equal('jk')
    fn1()
    expect(fn3.callCount).to.equal(2)
    expect(dummy).to.equal('j2k2')
  })

  it('nested transaction sequence must match ', () => {
    const model = observable({
      user: {
        firstName: 'j',
        lastName: 'k'
      }
    })
    const fn1 = spy(() => {
      startTransaction('phase1')
      model.user.firstName = 'j1'
      model.user.firstName = 'j2'
      fn2()
      endTransaction('phase1')
    })
    const fn2 = spy(() => {
      startTransaction('phase2')
      model.user.lastName = 'k1'
      model.user.lastName = 'k2'
      endTransaction('phase1')
    })
    let dummy
    const fn3 = spy(() => {
      dummy = model.user.firstName + model.user.lastName
    })
    observe(fn3)
    expect(fn3.callCount).to.equal(1)
    expect(dummy).to.equal('jk')
    expect(fn1).to.throw('transaction end not match with start')

    // restore, so that below test case can run normally
    transactionManager.stacks = []
  })

  it('should support function wrapper', () => {
    const model = observable({
      user: {
        firstName: 'j',
        lastName: 'k'
      }
    })
    const fn1 = spy(
      withTransaction(() => {
        model.user.firstName = 'j1'
        model.user.firstName = 'j2'
        fn2()
      })
    )
    const fn2 = spy(
      withTransaction(() => {
        model.user.lastName = 'k1'
        model.user.lastName = 'k2'
      })
    )
    let dummy
    const fn3 = spy(() => {
      dummy = model.user.firstName + model.user.lastName
    })
    observe(fn3)
    expect(fn3.callCount).to.equal(1)
    expect(dummy).to.equal('jk')
    fn1()
    expect(fn3.callCount).to.equal(2)
    expect(dummy).to.equal('j2k2')
  })

  it('should support class method decorator', () => {
    const model = observable({
      user: {
        firstName: 'j',
        lastName: 'k'
      }
    })
    class Foo {
      bar () {
        model.user.lastName = 'k1'
        model.user.lastName = 'k2'
      }
    }
    __decorate([withTransaction], Foo.prototype, 'bar', null)
    const foo = new Foo()
    const fn1 = spy(
      withTransaction(() => {
        model.user.firstName = 'j1'
        model.user.firstName = 'j2'
        fn2()
      })
    )
    const fn2 = spy(foo.bar)
    let dummy
    const fn3 = spy(() => {
      dummy = model.user.firstName + model.user.lastName
    })
    observe(fn3)
    expect(fn3.callCount).to.equal(1)
    expect(dummy).to.equal('jk')
    fn1()
    expect(fn3.callCount).to.equal(2)
    expect(dummy).to.equal('j2k2')
  })

  it('should support class attribute decorator', () => {
    const model = observable({
      user: {
        firstName: 'j',
        lastName: 'k'
      }
    })
    class Foo {
      bar = () => {
        model.user.lastName = 'k1'
        model.user.lastName = 'k2'
      };
    }
    __decorate([withTransaction], Foo.prototype, 'bar', undefined)
    const foo = new Foo()
    const fn1 = spy(
      withTransaction(() => {
        model.user.firstName = 'j1'
        model.user.firstName = 'j2'
        fn2()
      })
    )
    const fn2 = spy(foo.bar)
    let dummy
    const fn3 = spy(() => {
      dummy = model.user.firstName + model.user.lastName
    })
    observe(fn3)
    expect(fn3.callCount).to.equal(1)
    expect(dummy).to.equal('jk')
    fn1()
    expect(fn3.callCount).to.equal(2)
    expect(dummy).to.equal('j2k2')
  })

  it('must wrap to funciton', () => {
    expect(() => withTransaction('xx')).to.throw(
      'transaction should must wrap on Function: '
    )
  })
})
