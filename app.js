var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(morgan({
  format: function(tokens, req, res){
    var status = res.statusCode;
    var statusColor = 32;
    var time = (new Date - req._startTime);
    var timeColor = 32;

    if (status >= 500) statusColor = 31
    else if (status >= 400) statusColor = 33
    else if (status >= 300) statusColor = 36;

    if (time >= 1000) {
      timeColor = 31
    }

    return '\x1b[90m'
      + "C" + (process.env.pm_id || '')
      + ' ' + req.method
      + ' ' + (res.locals.type || '')
      + ' ' + (req.originalUrl || req.url)
      + ' '
      + '\x1b[' + statusColor + 'm' + res.statusCode
      + ' \x1b[' + timeColor + 'm'
      + time
      + 'ms'
      + '\x1b[0m';
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
