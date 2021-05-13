module.exports = function(app, settings){
	var log4js 		= require('log4js')
		, logger 	= log4js.getLogger('http')
		, debug		= require('debug')('http')
		, util 		= require('util')
		, csrf 		= require('csurf') // ref: https://github.com/expressjs/csurf
		, cookiee 	= require("cookie-encryption")
		, randomstring = require("randomstring")
		, models 	= require('../../models')
		, url 		= require('url')
		, express 	= require('express');


	var csrfProtection = csrf({ cookie: true });
	var router = express.Router();
	
	//If user identity validated then set cookie and redirect to returnUri
	var accountCookieName = settings.config.accountCookie.name;


	router.route('/logout')
		.all(function(req, res, next){
			//cleanup user cookie
			//detect if user cookie sid existes - this is a user session id stored in db
		    if(req.signedCookies[accountCookieName] !== undefined){
		    	res.clearCookie(accountCookieName);
		    }
		    return res.redirect('login');
		});

	//Process login request before rout filter
	router.route('/login')
	    .all(function(req, res, next){
	    	logger.debug("HANDLE LOGIN REQUEST");
	        return next();
	    })
	    .get(csrfProtection, function(req, res, next){
	        //Login page - render the ejs template
	        return res.render('login', { title: 'Login', message: 'Login', csrfToken: req.csrfToken()});
	    })
	    .post(csrfProtection, function(req, res, next){
	        //Login form handler
	        var form = req.body;

	        models.User.getAuthenticated(form.username, form.password, function(err, user, reason){
	        	if(err) throw err;

	        	if(user !== null){ //success
	        		//Save session into db
	        		models.UserSession.create({
	        			sid: randomstring.generate() //generate sessionid
	        			,user_id : user.id //TODO: should use build to replace hardcode field name here
	        		}).then(function(session){
	        			var accountCookie =  cookiee('blackpearl', {
							cipher: 'aes-256-cbc',
							encoding: 'base64',
							cookie: accountCookieName,
							httpOnly: false
						});

						res.cookie(accountCookieName, session.sid, { signed: true });
						return res.redirect(req.query.returnUrl || "/");

	        		}).catch(function(err){
					    //do something with your err?
					    logger.error(err);
						return res.render('login', 
							{ 	title: 'Register', csrfToken: req.csrfToken()
								, form: form, error: err.message  });
					});
	        		
	        	}else{
	        		if(reason === models.User.failedLogin.NOT_FOUND){
		        		return res.redirect('register');
		        	}
		        		
		        	return res.redirect("login");
	        	}
	        	
	        });
			
	    });

	router.route('/register')
		.all(function(req, res, next){
			next();
		})
		.get(csrfProtection, function(req, res, next){
			res.render('register', { title: 'Register', csrfToken: req.csrfToken() });
		})
		.post(csrfProtection, function(req, res, next){
			//logger.debug(" Register form body: " + util.inspect(req.body));
			
			var form = req.body;

			var user = models.User.create({
				username: form.username,
				password: form.password,
				email: form.email,
				mobile: form.mobile
			}).then(function(user){
				res.redirect('login');
			}).catch(function(err){
				debug("create user error: ", err.errors);
				return res.render('register'
					, { title: 'Register', csrfToken: req.csrfToken()
						, form: form, error: err });
			});
		});

	app.use('/user', router);
}