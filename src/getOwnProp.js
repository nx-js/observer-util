'use strict'

const hasOwnProp = Object.prototype.hasOwnProperty

module.exports = function getOwnProp (obj, key) {
  if (hasOwnProp.call(obj, key)) {
    return obj[key]
  }
}
