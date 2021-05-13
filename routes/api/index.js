module.exports = function(app, settings){
	var log4js 		= require('log4js')
		, debug		= require('debug')('api')
		, util 		= require('util')
		, cls 		= require('../../libs/continuationLocalStorage')
		, url 		= require('url')
		, jwt 		= require('jsonwebtoken'); //Use this npm in the future TODO: replace nJwt

	var logger = log4js.getLogger("api")
		, secretKey = settings.config.jwt.secret
		, namespace = cls.createNamespace();

	var validateBearerToken = function(bearer, cb){
		if(!bearer) cb(null);

		var token = bearer.substring("Bearer".length).trim();

		var verifiedJwt = jwt.verify(token, secretKey, function(err, token){
			if(err) return cb(err);
			
			// continue with the request
			// return deseriazlied JWT token
			debug("Verified jwt Token : " + util.inspect(token));

			return cb(null, token);
		});
	}

	//account subapp handle all frontend authentication requests
	app.use('/', function(req, res, next){
	    debug("api handlers: ");
		debug(req.headers);

	    //validate user JWT token and permissions
	    var bearer = req.headers['authorization'];
	    debug("Authorization: " + bearer);

	    // wrap the events from request and response
	    namespace.bindEmitter(req);
		namespace.bindEmitter(res);

	    validateBearerToken(bearer, function(err, token){
	    	if(err || !token){
	    		var err = new Error('Invalid Token');
			    err.status = 401;
			    return next(err);
	    	}
	    	res.locals.token = token;

	    	namespace.run(function() {
				namespace.set('jwt', token);
				next();
			});
	    });
	});


	require('./media')(app, settings);

	
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
	        res.status(err.status || 500)
	        	.json({
		            message: err.message,
		            error: err
		        });
	    });
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
	    res.status(err.status || 500)
	    	.json({
		        message: err.message,
		        error: {}
		    });
	});

	

};
