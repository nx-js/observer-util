require('reify')

const expect = require('chai').expect
const observer = require('../src')

describe('observe', () => {
  it('should throw TypeError on invalid first argument', () => {
    expect(() => observer.observe(12)).to.throw(TypeError)
    expect(() => observer.observe({})).to.throw(TypeError)
    expect(() => observer.observe()).to.throw(TypeError)
  })

  it('should observe basic properties', () => {
    let dummy
    const observable = observer.observable({counter: 0})
    observer.observe(() => dummy = observable.counter)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.counter = 7)
      .then(() => expect(dummy).to.equal(7))
  })

  it('should observe multiple properties', () => {
    let dummy
    const observable = observer.observable({ctr1: 0, ctr2: 0, ctr3: 0})
    observer.observe(() => dummy = observable.ctr1 + observable.ctr2 + observable.ctr3)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.ctr1 = observable.ctr2 = observable.ctr3 = 7)
      .then(() => expect(dummy).to.equal(21))
  })

  it('should handle multiple observers', () => {
    let dummy1, dummy2
    const observable = observer.observable({ctr: 0})
    observer.observe(() => dummy1 = observable.ctr)
    observer.observe(() => dummy2 = observable.ctr)

    return Promise.resolve()
      .then(() => {
        expect(dummy1).to.equal(0)
        expect(dummy2).to.equal(0)
      })
      .then(() => observable.ctr = 2)
      .then(() => {
        expect(dummy1).to.equal(2)
        expect(dummy2).to.equal(2)
      })
  })

  it('should observe nested properties', () => {
    let dummy
    const observable = observer.observable({nested: {counter: 0}})
    observer.observe(() => dummy = observable.nested.counter)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.nested.counter = 'invalid')
      .then(() => expect(dummy).to.equal('invalid'))
  })

  it('should observe delete operations', () => {
    let dummy
    const observable = observer.observable({prop: 'value'})
    observer.observe(() => dummy = observable.prop)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal('value'))
      .then(() => delete observable.prop)
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should observe properties on the prototype chain', () => {
    let dummy
    const observable = observer.observable({counter: 0})
    const parentObservable = observer.observable({counter: 2})
    Object.setPrototypeOf(observable, parentObservable)
    observer.observe(() => dummy = observable.counter)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => delete observable.counter)
      .then(() => expect(dummy).to.equal(2))
      .then(() => parentObservable.counter = 4)
      .then(() => expect(dummy).to.equal(4))
      .then(() => observable.counter = 3)
      .then(() => expect(dummy).to.equal(3))
  })

  it('should observe function call chains', () => {
    let dummy
    const observable = observer.observable({counter: 0})
    observer.observe(() => dummy = getCounter())

    function getCounter () {
      return observable.counter
    }

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.counter = 2)
      .then(() => expect(dummy).to.equal(2))
  })

  it('should observe for of iteration', () => {
    let dummy
    const observable = observer.observable({array: ['Hello']})
    observer.observe(() => dummy = observable.array.join(' '))

    function getCounter () {
      return observable.counter
    }

    return Promise.resolve()
      .then(() => expect(dummy).to.equal('Hello'))
      .then(() => observable.array.push('World!'))
      .then(() => expect(dummy).to.equal('Hello World!'))
      .then(() => observable.array.shift())
      .then(() => expect(dummy).to.equal('World!'))
  })

  it('should observe for in iteration', () => {
    let dummy = 0
    const observable = observer.observable({prop: 0})
    observer.observe(() => {
      dummy = 0
      for (let key in observable) {
        dummy += observable[key]
      }
    })

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(0))
      .then(() => observable.prop1 = 1)
      .then(() => expect(dummy).to.equal(1))
      .then(() => observable.prop2 = 3)
      .then(() => expect(dummy).to.equal(4))
      .then(() => observable.prop1 = 6)
      .then(() => expect(dummy).to.equal(9))
  })

  it('should not observe symbol keyed properties', () => {
    const key = Symbol()
    let dummy
    const observable = observer.observable({[key]: 'value'})
    observer.observe(() => dummy = observable[key])

    return Promise.resolve()
      .then(() => expect(dummy).to.equal('value'))
      .then(() => observable[key] = 'newValue')
      .then(() => expect(dummy).to.equal('value'))
  })

  it('should not observe function valued properties', () => {
    const oldFunc = () => {}
    const newFunc = () => {}

    let dummy
    const observable = observer.observable({ prop: oldFunc })
    observer.observe(() => dummy = observable.prop)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(oldFunc))
      .then(() => observable.prop = newFunc)
      .then(() => expect(dummy).to.equal(oldFunc))
  })

  it('should not observe set operations without a value change', () => {
    let dummy
    const observable = observer.observable({prop: 'prop'})

    let numOfRuns = 0
    function test () {
      dummy = observable.prop
      numOfRuns++
    }
    observer.observe(test)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal('prop'))
      .then(() => observable.prop = 'prop')
      .then(() => {
        expect(numOfRuns).to.equal(1)
        expect(dummy).to.equal('prop')
      })
      .then(() => observable.prop = 'prop2')
      .then(() => observable.prop = 'prop2')
      .then(() => {
        expect(numOfRuns).to.equal(2)
        expect(dummy).to.equal('prop2')
      })
  })

  it('should not observe $raw mutations', () => {
    let dummy
    const observable = observer.observable()
    observer.observe(() => dummy = observable.$raw.prop)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.prop = 'value')
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should not be triggered by $raw mutations', () => {
    let dummy
    const observable = observer.observable()
    observer.observe(() => dummy = observable.prop)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal(undefined))
      .then(() => observable.$raw.prop = 'value')
      .then(() => expect(dummy).to.equal(undefined))
  })

  it('should run synchronously after registration', () => {
    let dummy
    const observable = observer.observable({prop: 'prop'})

    let numOfRuns = 0
    observer.observe(() => {
      dummy = observable.prop
      numOfRuns++
    })

    expect(numOfRuns).to.equal(1)
    expect(dummy).to.equal('prop')

    return Promise.resolve()
      .then(() => {
        observable.prop = 'new prop'
      })
      .then(() => {
        expect(numOfRuns).to.equal(2)
        expect(dummy).to.equal('new prop')
      })
  })

  it('should rerun maximum once per stack', () => {
    let dummy
    const observable = observer.observable({prop1: 0, prop2: 0})

    let numOfRuns = 0
    function test () {
      dummy = observable.prop1 + observable.prop2
      numOfRuns++
    }
    observer.observe(test)

    return Promise.resolve()
      .then(() => {
        expect(numOfRuns).to.equal(1)
        expect(dummy).to.equal(0)
      })
      .then(() => {
        observable.prop1 = 1
        observable.prop2 = 3
        observable.prop1 = 2
      })
      .then(() => {
        expect(numOfRuns).to.equal(2)
        expect(dummy).to.equal(5)
      })
  })

  it('should avoid infinite loops', () => {
    const observable1 = observer.observable({prop: 'value1'})
    const observable2 = observer.observable({prop: 'value2'})

    let numOfRuns1 = 0
    let numOfRuns2 = 0
    function test1 () {
      observable1.prop = observable2.prop
      numOfRuns1++
    }
    function test2 () {
      observable2.prop = observable1.prop
      numOfRuns2++
    }
    observer.observe(test1)
    observer.observe(test2)

    return Promise.resolve()
      .then(() => observable1.prop = 'Hello')
      .then(() => expect(observable2.prop).to.equal('Hello'))
      .then(() => observable2.prop = 'World!')
      .then(() => expect(observable1.prop).to.equal('World!'))
      .then(() => {
        expect(numOfRuns1).to.equal(3)
        expect(numOfRuns2).to.equal(3)
      })
  })

  it('should return the passed function', () => {
    let dummy
    const observable = observer.observable({counter: 0})
    const fn = () => dummy = observable.counter
    const signal = observer.observe(fn)
    expect(signal).to.equal(fn)
  })

  it('should simply run the function on multiple observation', () => {
    let numOfRuns = 0
    const observable = observer.observable({counter: 0})

    function test () {
      const value = observable.counter
      numOfRuns++
    }
    const signal1 = observer.observe(test)
    const signal2 = observer.observe(test)
    expect(signal1).to.equal(signal2)

    expect(numOfRuns).to.equal(2)
    return Promise.resolve()
      .then(() => observable.counter++)
      .then(() => expect(numOfRuns).to.equal(3))
  })

  it('should be able to re-observe unobserved functions', () => {
    let dummy = 0
    const observable = observer.observable({counter: 0})
    const signal = observer.observe(() => dummy = observable.counter)

    return Promise.resolve()
      .then(() => observable.counter++)
      .then(() => expect(dummy).to.equal(1))
      .then(() => observer.unobserve(signal))
      .then(() => observable.counter++)
      .then(() => expect(dummy).to.equal(1))
      .then(() => observer.observe(signal))
      .then(() => expect(dummy).to.equal(2))
      .then(() => observable.counter++)
      .then(() => expect(dummy).to.equal(3))
  })

  it('should execute in first-tigger order', () => {
    let dummy = ''
    const observable = observer.observable({prop1: 'prop1', prop2: 'prop2', prop3: 'prop3'})

    observer.observe(() => dummy += observable.prop1)
    observer.observe(() => dummy += observable.prop2)
    observer.observe(() => dummy += observable.prop3)

    return Promise.resolve()
      .then(() => expect(dummy).to.equal('prop1prop2prop3'))
      .then(() => {
        dummy = ''
        observable.prop2 = 'p'
        observable.prop1 = 'p1'
        observable.prop3 = 'p3'
        observable.prop2 = 'p2'
      })
      .then(() => expect(dummy).to.equal('p2p1p3'))
  })
})
