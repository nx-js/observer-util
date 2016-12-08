'use strict'

const nx = require('./observer')
const mobx = require('mobx')
const Canvas = require('canvas')
const Chart = require('nchart')
const fs = require('fs')

const NUM_OF_RUNS = 100000

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
    (10 props)`,
    'New property',
    'Set operation',
    'Get operation',
    'Function creation',
    'Function trigger',
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
  onAnimationComplete () {
    const ctx = this.chart.ctx
    const datasets = this.datasets
    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i]
      ctx.fillStyle = dataset.fillColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'left'
      ctx.fillRect((i + 1) * 100, 15, 20, 10)
      ctx.fillText(dataset.label, (i + 1) * 100 + 25, 20)
    }
  }
}

const objs = [], nxObjs = [], mobxObjs = [], nxSignals = [], mobxSignals = []
let start = Date.now()

// OBJECT CREATION (3 PROPS)
for (let i = 0; i < NUM_OF_RUNS; i++) {
  objs.push({ prop: 0, nested: { prop: 0 } })
}
updateResult('vanilla', 'object creation (3 props)')

for (let i = 0; i < NUM_OF_RUNS; i++) {
  mobxObjs.push(mobx.observable({ prop: 0, nested: { prop: 0 } }))
}
updateResult('mobx', 'object creation (3 props)')

for (let i = 0; i < NUM_OF_RUNS; i++) {
  nxObjs.push(nx.observable({ prop: 0, nested: { prop: 0 } }))
}
updateResult('nx', 'object creation (3 props)')

// OBJECT CREATION (10 PROPS)
for (let i = 0; i < NUM_OF_RUNS; i++) {
  const obj = {}
  for (let j = 0; j < 10; j++) {
    obj[j] = j
  }
}
updateResult('vanilla', 'object creation (10 props)')

for (let i = 0; i < NUM_OF_RUNS; i++) {
  const obj = {}
  for (let j = 0; j < 10; j++) {
    obj[j] = j
  }
  const mobxObj = mobx.observable(obj)
}
updateResult('mobx', 'object creation (10 props)')

for (let i = 0; i < NUM_OF_RUNS; i++) {
  const obj = {}
  for (let j = 0; j < 10; j++) {
    obj[j] = j
  }
  const nxObj = nx.observable(obj)
}
updateResult('nx', 'object creation (10 props)')

// DYNAMIC PROPERTY ADDITION
for (let obj of objs) {
  obj.dynamic = 0
}
updateResult('vanilla', 'dynamic property addition')

for (let mobxObj of mobxObjs) {
  mobx.extendObservable(mobxObj, { dynamic: 0 })
}
updateResult('mobx', 'dynamic property addition')

for (let nxObj of nxObjs) {
  nxObj.dynamic = 0
}
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
  const func1 = () => obj.prop
  const func2 = () => obj.nested.prop
  const func3 = () => obj.dynamic
  const func4 = () => obj.prop + obj.nested.prop + obj.dynamic
}
updateResult('vanilla', 'function creation')

for (let mobxObj of mobxObjs) {
  mobxSignals.push(mobx.autorun(() => mobxObj.prop))
  mobxSignals.push(mobx.autorun(() => mobxObj.nested.prop))
  mobxSignals.push(mobx.autorun(() => mobxObj.dynamic))
  mobxSignals.push(mobx.autorun(() => mobxObj.prop + mobxObj.nested.prop + mobxObj.dynamic))
}
updateResult('mobx', 'observer function creation')

for (let nxObj of nxObjs) {
  nxSignals.push(nx.observe(() => nxObj.prop))
  nxSignals.push(nx.observe(() => nxObj.nested.prop))
  nxSignals.push(nx.observe(() => nxObj.dynamic))
  nxSignals.push(nx.observe(() => nxObj.prop + nxObj.nested.prop + nxObj.dynamic))
}
updateResult('nx', 'observer function creation')

// TRIGGER OBSERVER FUNCTIONS
let promise = Promise.resolve()

for (let mobxObj of mobxObjs) {
  promise = promise
    .then(() => mobxObj.prop -= 1)
    .then(() => mobxObj.nested.prop -= 2)
    .then(() => mobxObj.dynamic -= 3)
}
promise = promise.then(() => updateResult('mobx', 'observer function trigger'))

for (let nxObj of nxObjs) {
  promise = promise
    .then(() => nxObj.prop -= 1)
    .then(() => nxObj.nested.prop -= 2)
    .then(() => nxObj.dynamic -= 3)
}
promise = promise.then(() => updateResult('nx', 'observer function trigger'))

// UNOBSERVE OBSERVER FUNCTIONS
promise = promise.then(() => {
  for (let mobxSignal of mobxSignals) {
    mobxSignal()
  }
})
promise = promise.then(() => updateResult('mobx', 'unobserve observer function'))

promise = promise.then(() => {
  for (let nxSignal of nxSignals) {
    nx.unobserve(nxSignal)
  }
})
promise = promise.then(() => updateResult('nx', 'unobserve observer function'))

// CREATE RESULT CHART
promise.then(createChart)

// UTILITIES
function updateResult (framework, message) {
  const diff = Date.now() - start
  result[framework].push(diff)
  console.log(`${framework} ${message}: ${diff} ms`)
  start = Date.now()
}

function createChart () {
  const canvas = new Canvas(600, 400)
  const ctx = canvas.getContext('2d')
  const chart = new Chart(ctx).Bar(chartData, chartOptions)
  const legend = chart.generateLegend()
  canvas.toBuffer((err, buf) => fs.writeFile(__dirname + '/benchmark.png', buf))
}
