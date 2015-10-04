var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errors = require('./lib/errors');

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
      + "\C" + (process.env.pm_id || '')
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

// app host selector
app.use(function(req, res, next) {
  var host = req.get('host');
  var type = req.query.type;

  if (type) {
    if (type === 'ghosts') {
      res.locals.type = 'ghosts'
    } else if (type === 'fragments') {
      res.locals.type = 'fragments'
    } else {
      next(new errors.NotFound("Unrecognized type, must be 'ghosts' or 'fragments'"))
    }
  } else if (host.indexOf("destinydeadghosts.com") > -1) {
    res.locals.type = 'ghosts'
  } else if (host.indexOf("destinycalcifiedfragments.com") > -1) {
    res.locals.type = 'fragments'
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

app.set('port', process.env.PORT || 3000);

// warm up the cache
// then run the web app
var bungieLookup = require('./lib/bungie_lookup');
bungieLookup.getCardDetails()
  .then(function() {
    app.listen(app.get('port'));
  })
  .catch(function(err) {
    console.error(err.stack || err)
  })

module.exports = app;
