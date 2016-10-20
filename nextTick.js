'use strict'

let mutateWithTask
let currTask

if (typeof MutationObserver !== 'undefined') {
  let counter = 0
  const observer = new MutationObserver(onMutation)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {characterData: true})

  function onMutation () {
    if (currTask) {
      currTask()
    }
  }

  mutateWithTask = function mutateWithTask () {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
}

module.exports = function nextTick (task) {
  currTask = task
  if (mutateWithTask) {
    mutateWithTask()
  } else {
    Promise.resolve().then(task)
  }
}
