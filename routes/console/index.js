/**
 *	Management Console
 */
"user strict"

module.exports = function(app, settings){
	var log4js 		= require('log4js')
		, debug		= require('debug')('console')
		, util 		= require('util')
		, cls 		= require('../../libs/continuationLocalStorage')
		, url 		= require('url')
		, models 	= require('../../models'); //Use this npm in the future TODO: replace nJwt

	var logger 		= log4js.getLogger("console")
		, namespace = cls.createNamespace()
		, accountCookieName = settings.config.accountCookie.name; 

	//set template location
	app.set('views', './routes/console/views');

	//account subapp handle all frontend authentication requests
	app.use('/', function(req, res, next){
	    debug("admin console");

	    // wrap the events from request and response
	    namespace.bindEmitter(req);
		namespace.bindEmitter(res);

	    //detect if user cookie sid existes - this is a user session id stored in db
	    models.UserSession.getAuthenticated(req.signedCookies[accountCookieName]
	    	, function(err, user, reason){
				if(err) logger.error(" Error in validating sid : " + err);

				if(user !== null){
					//user valid, success login
					//save user information into response object
					res.locals.user = user;

					return namespace.run(function() {
						namespace.set('principal', user);
						next();
					});
				}else{
					//redirect to login page w/ returnUrl
			    	var returnUrl = url.format({
					    protocol: req.protocol,
					    host: req.get('host'),
					    pathname: req.originalUrl
					});
					
					debug("Return URL: ", returnUrl );

			    	return res.redirect('/identity/user/login?returnUrl=' + returnUrl);
				}
			}
		);
	});

	require('./accounts')(app, settings);

	app.get('/', function(req, res, next){
		debug("Admin home!")
		return res.render('index');
	});

}