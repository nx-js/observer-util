'use strict'

const hasOwnProperty = Object.prototype.hasOwnProperty

module.exports = function getOwnProperty (obj, key) {
  return (hasOwnProperty.call(obj, key) && obj[key]) || undefined
}
