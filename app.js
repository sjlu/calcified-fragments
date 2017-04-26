var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errors = require('./lib/errors');
var config = require('./config');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
// app.use(morgan('dev'));

app.use(bodyParser.json({
  extended: true
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app host selector
app.use(function(req, res, next) {
  var host = req.get('host');
  var type = req.query.type;

  if (type) {
    if (type === 'ghosts') {
      res.locals.type = 'ghosts'
    } else if (type === 'fragments') {
      res.locals.type = 'fragments'
    } else if (type === 'siva') {
      res.locals.type = 'siva'
    } else {
      next(new errors.NotFound("Unrecognized type, must be 'ghosts' or 'fragments'"))
    }
  } else if (host.indexOf("destinydeadghosts.com") > -1) {
    res.locals.type = 'ghosts'
  } else if (host.indexOf("destinycalcifiedfragments.com") > -1) {
    res.locals.type = 'fragments'
  } else if (host.indexOf("destinysivaclusters.com") > -1) {
    res.locals.type = 'siva'
  } else if (host.indexOf("calcified-fragments.herokuapp.com") > -1) {
    return res.redirect('http://destinycalcifiedfragments.com' + req.originalUrl)
  } else { // localhost
    res.locals.type = 'fragments'
  }

  return next()
})
app.use('/', require('./routes/index'));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;
