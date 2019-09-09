import chai from 'chai'
import { spy } from './utils'
import {
  observe,
  observable,
  startTransaction,
  endTransaction
} from 'nemo-observer-util'
import { withTransaction } from '../src';
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
        lastName: 'k',
      }
    });
    const fn1 = spy(() => {
      startTransaction('phase1');
      model.user.firstName = 'j1';
      model.user.firstName = 'j2';
      fn2();
      endTransaction('phase1');
    });
    const fn2 = spy(() => {
      startTransaction('phase2');
      model.user.lastName = 'k1';
      model.user.lastName = 'k2';
      endTransaction('phase2');
    });
    let dummy
    const fn3 = spy(() => {
      dummy = model.user.firstName + model.user.lastName
    });
    observe(fn3);
    expect(fn3.callCount).to.equal(1)
    expect(dummy).to.equal('jk');
    fn1();
    expect(fn3.callCount).to.equal(2)
    expect(dummy).to.equal('j2k2');
  });


  it('should support function wrapper', () => {
    const model = observable({
      user: {
        firstName: 'j',
        lastName: 'k',
      }
    });
    const fn1 = spy(withTransaction(() => {
      model.user.firstName = 'j1';
      model.user.firstName = 'j2';
      fn2();
    }));
    const fn2 = spy(withTransaction(() => {
      model.user.lastName = 'k1';
      model.user.lastName = 'k2';
    }));
    let dummy
    const fn3 = spy(() => {
      dummy = model.user.firstName + model.user.lastName
    });
    observe(fn3);
    expect(fn3.callCount).to.equal(1)
    expect(dummy).to.equal('jk');
    fn1();
    expect(fn3.callCount).to.equal(2)
    expect(dummy).to.equal('j2k2');
  });
})
