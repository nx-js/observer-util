'use strict'

var nx = require('../src/observer')

var NUM_OF_RUNS = 200
var nxObjs = []
var nxBigObjs = []
var nxArrays = []
var nxSignals = []
var nxSum = 0

// OBJECT CREATION (3 PROPS)
for (var i = 0; i < NUM_OF_RUNS; i++) {
  nxObjs.push(nx.observable({ prop: 0, nested: { prop: 0 } }))
}

// OBJECT CREATION (15 PROPS)
for (var i = 0; i < NUM_OF_RUNS; i++) {
  var obj = {}
  for (var j = 0; j < 15; j++) {
    obj[j] = j
  }
  nxBigObjs.push(nx.observable(obj))
}

// DYNAMIC PROPERTY ADDITION
for (var nxObj of nxObjs) {
  nxObj.dynamic = 0
}

// SET OPERATION
for (var nxObj of nxObjs) {
  nxObj.prop += 1
  nxObj.nested.prop += 2
  nxObj.dynamic += 3
}

// GET OPERATION
for (var nxObj of nxObjs) {
  var sum = nxObj.prop + nxObj.nested.prop + nxObj.dynamic
}

// FUNCTION/OBSERVER CREATION
for (var nxObj of nxObjs) {
  nxSignals.push(nx.observe(() => nxSum += nxObj.prop))
  nxSignals.push(nx.observe(() => nxSum += nxObj.nested.prop))
  nxSignals.push(nx.observe(() => nxSum += nxObj.dynamic))
  nxSignals.push(nx.observe(() => nxSum += nxObj.prop + nxObj.nested.prop + nxObj.dynamic))
}

Promise.resolve()

// TRIGGER OBSERVER FUNCTIONS
.then(() => {
  nxSum = 0
  for (var nxObj of nxObjs) {
    nxObj.prop = 4
    nxObj.nested.prop = 5
    nxObj.dynamic = 6
  }
})

// TRIGGER OBSERVER FUNCTIONS SECOND TIME
.then(() => {
  nxSum = 0
  for (var nxObj of nxObjs) {
    nxObj.prop = 1
    nxObj.nested.prop = 2
    nxObj.dynamic = 3
  }
})

// NO VALUE CHANGE
.then(() => {
  for (var nxObj of nxObjs) {
    nxObj.prop = 1
    nxObj.nested.prop = 2
    nxObj.dynamic = 3
  }
})

// UNOBSERVE OBSERVER FUNCTIONS
.then(() => {
  for (var nxSignal of nxSignals) {
    nx.unobserve(nxSignal)
  }
})
