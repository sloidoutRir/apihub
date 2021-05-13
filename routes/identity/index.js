module.exports = function(app, settings){
	var log4js 		= require('log4js')
		, util 		= require('util')
		, url 		= require('url')
		, debug		= require('debug')('http') 
		, models 	= require('../../models');

	var logger 	= log4js.getLogger("http")
		, accountCookieName = settings.config.accountCookie.name; //If user identity validated then set cookie and redirect to returnUri

	//set template location
	app.set('views', './routes/identity/views');

	//account subapp handle all frontend authentication requests
	app.use('/', function(req, res, next){
	    debug("identity service handlers cookies: ", util.inspect(req.signedCookies));
        

        if(req.originalUrl.toLowerCase().indexOf('/identity/user', 0) === 0 
        		|| req.originalUrl.toLowerCase().indexOf('/identity/oauth2/token', 0) === 0
        		|| req.originalUrl.toLowerCase().indexOf('/identity/wechat', 0) === 0){
        	
        	return next();
        }

	    //detect if user cookie sid existes - this is a user session id stored in db
	    models.UserSession.getAuthenticated(req.signedCookies[accountCookieName]
	    	, function(err, user, reason){
				if(err) logger.error(" Error in validating sid : " + err);

				if(user !== null){
					//user valid, success login
					//save user information into response object
					res.locals.user = user;
					return next();
				}

				//redirect to login page w/ returnUrl
		    	var returnUrl = url.format({
				    protocol: req.protocol,
				    host: req.get('host'),
				    pathname: req.originalUrl
				});
				
				debug("Return URL: ", returnUrl );

		    	return res.redirect(req.baseUrl + '/user/login?returnUrl=' + returnUrl);

			}
		);
	});
	
	require('./wechat')(app, settings);
	require('./client')(app, settings);
	require('./oauth2')(app, settings);
	require('./user')(app, settings);
	
};
