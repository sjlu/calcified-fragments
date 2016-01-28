var inspect = require('eyes').inspector({
  pretty: true,
  hideFunctions: true,
  maxLength: 0
})
var config = require('../config')

if (config.ENV !== 'development') {
  inspect = function() {}
}

module.exports = inspect;