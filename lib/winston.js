var winston = require('winston')
var config = require('../config')

winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  colorize: true,
  level: config.LOG_LEVEL
})

module.exports = winston
