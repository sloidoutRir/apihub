module.exports = function(app, settings){
	var log4js 		= require('log4js')
		, debug			= require('debug')('api')
		, util 			= require('util')
		, url 			= require('url')
		, cookieParser = require('cookie-parser')
		, bodyParser   = require('body-parser')
		, express  	= require('express')
		, models 		= require('../../models');

	var logger = log4js.getLogger("api");


	app.use(function(req, res, next){
	  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	  debug('Client IP:', ip);
	  return next();
	});


	var qywxSubApp	= express();
	app.use('/qywx', qywxSubApp);
	require('./qywx')(qywxSubApp, settings);

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
	    var err = new Error('Not Found');
	    err.status = 404;
	    next(err);
	});

	// development error handler
	// will print stacktrace
	if (app.get('env') === 'development') {
	    app.use(function(err, req, res, next) {
					console.log(util.inspect(err));
	        res.status(err.status || 500)
	        	.json({
								errCode: err.status || 500,
		            errMsg: err.message,
		            error: err
		        });
	    });
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
	    res.status(err.status || 500)
	    	.json({
					errCode: err.status || 500,
					errMsg: err.message,
					error: {}
		    });
	});
};
