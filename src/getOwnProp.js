'use strict'

const hasOwnProp = Object.prototype.hasOwnProperty

module.exports = function getOwnProp (obj, key) {
  return (hasOwnProp.call(obj, key) && obj[key])
}
