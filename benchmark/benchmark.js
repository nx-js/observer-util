'use strict'

const nx = require('../src/observer')
const mobx = require('mobx')
const Canvas = require('canvas')
const fs = require('fs')
const Chart = require('nchart')

const NUM_OF_RUNS = 2000

const result = {
  vanilla: [],
  mobx: [],
  nx: []
}

const chartData = {
  labels: [
    `Object creation
      (3 props)`,
    `Object creation
      (15 props)`,
    'New property',
    'Set operation',
    'Get operation',
    'Function creation',
    'Function trigger',
    `Function trigger
      (2nd time)`,
    `Function trigger
    (no value change)`,
    'Function cleanup'
  ],
  datasets: [
    {
      label: 'Vanilla',
      fillColor: '#00008B',
      data: result.vanilla
    },
    {
      label: 'MobX',
      fillColor: '#FF6900',
      data: result.mobx
    },
    {
      label: 'NX',
      fillColor: '#00746a',
      data: result.nx
    }
  ]
}

const chartOptions = {
  barValueSpacing: 15,
  scaleBeginAtZero: true,
  scaleLabel: '<%=value%> ms',
  scaleFontSize: 16,
  onAnimationComplete () {
    const ctx = this.chart.ctx
    const datasets = this.datasets

    ctx.textAlign = 'left'
    ctx.textBaseline = 'left'
    ctx.font = 'normal 16px Calibri'
    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i]
      ctx.fillStyle = dataset.fillColor
      ctx.fillRect((i + 1) * 100 + 625, 12, 20, 14)
      ctx.fillText(dataset.label, (i + 1) * 100 + 650, 20)
    }
  }
}

const objs = []
const bigObjs = []
const arrays = []
let sum = 0
const mobxObjs = []
const mobxBigObjs = []
const mobxArrays = []
const mobxSignals = []
let mobxSum = 0
const nxObjs = []
const nxBigObjs = []
const nxArrays = []
const nxSignals = []
let nxSum = 0

let start = Date.now()

// OBJECT CREATION (3 PROPS)
for (let i = 0; i < NUM_OF_RUNS; i++) {
  objs.push({ prop: 0, nested: { prop: 0 } })
}
assert(`objs length is ${NUM_OF_RUNS}`, ()  => objs.length === NUM_OF_RUNS)
updateResult('vanilla', 'object creation (3 props)')

for (let i = 0; i < NUM_OF_RUNS; i++) {
  mobxObjs.push(mobx.observable({ prop: 0, nested: { prop: 0 } }))
}
assert(`mobxObjs length is ${NUM_OF_RUNS}`, ()  => mobxObjs.length === NUM_OF_RUNS)
updateResult('mobx', 'object creation (3 props)')

for (let i = 0; i < NUM_OF_RUNS; i++) {
  nxObjs.push(nx.observable({ prop: 0, nested: { prop: 0 } }))
}
assert(`nxObjs length is ${NUM_OF_RUNS}`, ()  => objs.length === NUM_OF_RUNS)
updateResult('nx', 'object creation (3 props)')

// OBJECT CREATION (15 PROPS)
for (let i = 0; i < NUM_OF_RUNS; i++) {
  const obj = {}
  for (let j = 0; j < 15; j++) {
    obj[j] = j
  }
  bigObjs.push(obj)
}
assert(`bigObjs length is ${NUM_OF_RUNS}`, ()  => bigObjs.length === NUM_OF_RUNS)
updateResult('vanilla', 'object creation (15 props)')

for (let i = 0; i < NUM_OF_RUNS; i++) {
  const obj = {}
  for (let j = 0; j < 15; j++) {
    obj[j] = j
  }
  mobxBigObjs.push(mobx.observable(obj))
}
assert(`mobxBigObjs length is ${NUM_OF_RUNS}`, ()  => mobxBigObjs.length === NUM_OF_RUNS)
updateResult('mobx', 'object creation (15 props)')

for (let i = 0; i < NUM_OF_RUNS; i++) {
  const obj = {}
  for (let j = 0; j < 15; j++) {
    obj[j] = j
  }
  nxBigObjs.push(nx.observable(obj))
}
assert(`nxBigObjs length is ${NUM_OF_RUNS}`, ()  => nxBigObjs.length === NUM_OF_RUNS)
updateResult('nx', 'object creation (15 props)')

// DYNAMIC PROPERTY ADDITION
for (let obj of objs) {
  obj.dynamic = 0
}
assert(`objs[${NUM_OF_RUNS - 1}].dynamic is 0`, ()  => objs[NUM_OF_RUNS - 1].dynamic === 0)
updateResult('vanilla', 'dynamic property addition')

for (let mobxObj of mobxObjs) {
  mobx.extendObservable(mobxObj, { dynamic: 0 })
}
assert(`mobxObjs[${NUM_OF_RUNS - 1}].dynamic is 0`, ()  => mobxObjs[NUM_OF_RUNS - 1].dynamic === 0)
updateResult('mobx', 'dynamic property addition')

for (let nxObj of nxObjs) {
  nxObj.dynamic = 0
}
assert(`nxObjs[${NUM_OF_RUNS - 1}].dynamic is 0`, ()  => nxObjs[NUM_OF_RUNS - 1].dynamic === 0)
updateResult('nx', 'dynamic property addition')

// SET OPERATION
for (let obj of objs) {
  obj.prop += 1
  obj.nested.prop += 2
  obj.dynamic += 3
}
updateResult('vanilla', 'set operation')

for (let mobxObj of mobxObjs) {
  mobxObj.prop += 1
  mobxObj.nested.prop += 2
  mobxObj.dynamic += 3
}
updateResult('mobx', 'set operation')

for (let nxObj of nxObjs) {
  nxObj.prop += 1
  nxObj.nested.prop += 2
  nxObj.dynamic += 3
}
updateResult('nx', 'set operation')

// GET OPERATION
for (let obj of objs) {
  const sum = obj.prop + obj.nested.prop + obj.dynamic
}
updateResult('vanilla', 'get operation')

for (let mobxObj of mobxObjs) {
  const sum = mobxObj.prop + mobxObj.nested.prop + mobxObj.dynamic
}
updateResult('mobx', 'get operation')

for (let nxObj of nxObjs) {
  const sum = nxObj.prop + nxObj.nested.prop + nxObj.dynamic
}
updateResult('nx', 'get operation')

// FUNCTION/OBSERVER CREATION
for (let obj of objs) {
  const func1 = () => sum += obj.prop
  const func2 = () => sum += obj.nested.prop
  const func3 = () => sum += obj.dynamic
  const func4 = () => sum += obj.prop + obj.nested.prop + obj.dynamic
}
updateResult('vanilla', 'function creation')

for (let mobxObj of mobxObjs) {
  mobxSignals.push(mobx.autorun(() => mobxSum += mobxObj.prop))
  mobxSignals.push(mobx.autorun(() => mobxSum += mobxObj.nested.prop))
  mobxSignals.push(mobx.autorun(() => mobxSum += mobxObj.dynamic))
  mobxSignals.push(mobx.autorun(() => mobxSum += mobxObj.prop + mobxObj.nested.prop + mobxObj.dynamic))
}
assert(`mobxSignals length is ${NUM_OF_RUNS * 4}`, ()  => mobxSignals.length === (NUM_OF_RUNS * 4))
updateResult('mobx', 'observer function creation')

for (let nxObj of nxObjs) {
  nxSignals.push(nx.observe(() => nxSum += nxObj.prop))
  nxSignals.push(nx.observe(() => nxSum += nxObj.nested.prop))
  nxSignals.push(nx.observe(() => nxSum += nxObj.dynamic))
  nxSignals.push(nx.observe(() => nxSum += nxObj.prop + nxObj.nested.prop + nxObj.dynamic))
}
assert(`nxSignals length is ${NUM_OF_RUNS * 4}`, ()  => nxSignals.length === (NUM_OF_RUNS * 4))
updateResult('nx', 'observer function creation')


Promise.resolve()

// TRIGGER OBSERVER FUNCTIONS
.then(() => mobx.transaction(() => {
  mobxSum = 0
  for (let mobxObj of mobxObjs) {
    mobxObj.prop = 4
    mobxObj.nested.prop = 5
    mobxObj.dynamic = 6
  }
}))
.then(() => assert(`mobxSum is ${NUM_OF_RUNS * 30}`, ()  => mobxSum === (NUM_OF_RUNS * 30)))
.then(() => updateResult('mobx', 'observer function trigger'))

.then(() => {
  nxSum = 0
  for (let nxObj of nxObjs) {
    nxObj.prop = 4
    nxObj.nested.prop = 5
    nxObj.dynamic = 6
  }
})
.then(() => assert(`nxSum is ${NUM_OF_RUNS * 30}`, ()  => nxSum === (NUM_OF_RUNS * 30)))
.then(() => updateResult('nx', 'observer function trigger'))

// TRIGGER OBSERVER FUNCTIONS SECOND TIME
.then(() => mobx.transaction(() => {
  mobxSum = 0
  for (let mobxObj of mobxObjs) {
    mobxObj.prop = 1
    mobxObj.nested.prop = 2
    mobxObj.dynamic = 3
  }
}))
.then(() => assert(`mobxSum is ${NUM_OF_RUNS * 12}`, ()  => mobxSum === (NUM_OF_RUNS * 12)))
.then(() => updateResult('mobx', 'observer function trigger (2nd time)'))

.then(() => {
  nxSum = 0
  for (let nxObj of nxObjs) {
    nxObj.prop = 1
    nxObj.nested.prop = 2
    nxObj.dynamic = 3
  }
})
.then(() => assert(`nxSum is ${NUM_OF_RUNS * 12}`, ()  => nxSum === (NUM_OF_RUNS * 12)))
.then(() => updateResult('nx', 'observer function trigger (2nd time)'))

.then(() => mobx.transaction(() => {
  for (let mobxObj of mobxObjs) {
    mobxObj.prop = 1
    mobxObj.nested.prop = 2
    mobxObj.dynamic = 3
  }
}))
.then(() => assert(`mobxSum is ${NUM_OF_RUNS * 12}`, ()  => mobxSum === (NUM_OF_RUNS * 12)))
.then(() => updateResult('mobx', 'observer function trigger (no value change)'))

.then(() => {
  for (let nxObj of nxObjs) {
    nxObj.prop = 1
    nxObj.nested.prop = 2
    nxObj.dynamic = 3
  }
})
.then(() => assert(`nxSum is ${NUM_OF_RUNS * 12}`, ()  => nxSum === (NUM_OF_RUNS * 12)))
.then(() => updateResult('nx', 'observer function trigger (no value change)'))

// UNOBSERVE OBSERVER FUNCTIONS
.then(() => {
  for (let mobxSignal of mobxSignals) {
    mobxSignal()
  }
})
.then(() => updateResult('mobx', 'unobserve observer function'))

.then(() => {
  for (let nxSignal of nxSignals) {
    nxSignal.unobserve()
  }
})
.then(() => updateResult('nx', 'unobserve observer function'))

// CREATE RESULT CHART
.then(createChart)

// UTILITIES
function assert (description, assertion) {
  if (!assertion()) {
    console.log('\x1b[31m', 'Assertion failed:', description, '\x1b[30m')
  }
}

function updateResult (framework, message) {
  const diff = Date.now() - start
  result[framework].push(diff)
  console.log(`${framework} ${message}: ${diff} ms`)
  start = Date.now()
}

function createChart () {
  const canvas = new Canvas(1000, 600)
  const ctx = canvas.getContext('2d')
  const chart = new Chart(ctx).Bar(chartData, chartOptions)
  const legend = chart.generateLegend()
  canvas.toBuffer((err, buf) => fs.writeFile(__dirname + '/benchmark.png', buf))
  console.log('See ./benchmark.png for the benchmark result in a barchart format.')
}
