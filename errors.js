// see: http://dustinsenos.com/articles/customErrorsInNode
var util = require('util')

// error base class
var UserError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this)
  this.message = msg || 'Error'
  this.status = 400
}
util.inherits(UserError, Error)
UserError.prototype.name = 'UserError'


// error factory
function defineError(name, status) {
  var Err = function (msg, data) {
    Err.super_.call(this, msg, this.constructor)
    this.status = status
    this.data = data;
  }
  util.inherits(Err, UserError)
  Err.prototype.name = name
  Err.prototype.message = name

  exports[name] = Err
}

defineError('AccessDenied', 401)
defineError('NotFound', 404)
defineError('UserNotFound', 404)