module.exports = function(app, settings){
	var log4js 		= require('log4js')
		, util 		= require('util')
		, csrf 		= require('csurf') // ref: https://github.com/expressjs/csurf
		, jwt 		= require('jsonwebtoken')
		, bcrypt 	= require('bcrypt-as-promised')
		, randomstring = require("randomstring")
		, url 		= require('url')
		, express 	= require('express')
		, models 	= require("../../models");		


	var logger 						= log4js.getLogger()
		, SALT_WORK_FACTOR 			= 10
		, ACCESS_TOKEN_EXPIRES_IN 	= 2 * 60 * 60 //In seconds
		, csrfProtection 			= csrf({ cookie: true })
		, router 					= express.Router()
		, secretKey 				= settings.config.jwt.secret //JWT SEcret token
		, UserSession 				= models.UserSession
		, Client 					= models.Client
		, AuthCode 					= models.AuthCode
		, User 						= models.User;



	router.route('/auth')
		.all(function(req, res, next){
			next();
		})
		.get(csrfProtection, function(req, res, next){
			//parameters for GET requests:
			// @param response_type=code
			// @param client_id=xxxxxx
			// @param state=xxxxxxxxx
			// @param callback=
			// @param scope=

			var clientId = req.query.client_id;
			var callback = req.query.callback;
			var responseType = req.query.response_type;
			var state = req.query.state;
			var scope = req.query.scope;

			switch(responseType){
				case 'code':
					//oAuth2 authorization code flow
					if(!callback || !clientId){
						var err = new Error("Missing parameters");
						throw err;
					}

					//check if client_id is valid
					Client.find({ clientId: clientId })
						.then(function(client){
							if(!client) throw err;

							//TODO: check if callback is valid in client's setting
							//callback is a field in Client

							//render the authorization grant assertion page
							return res.render('auth'
										, { 
											csrfToken: req.csrfToken()
										}
									);
							
						});
					break;

				default:
					var err = new Error('Invalid authorization flow');
					throw err;
			}
		})
		.post(csrfProtection, function(req, res, next){ 
			var responseType = req.query.response_type; 

			if(responseType === 'code'){
				var callback = req.query.callback;
				var clientId = req.query.client_id;
				var state = req.query.state;
				
				
				return AuthCode.generateAuthCode(clientId, 
					res.locals.user._id, 
					function(err, authCode){
						//compose callback url
						var cbUrl = url.parse(callback, true);
						cbUrl.query.state = state;
						cbUrl.query.code = authCode.authCode;

						return res.redirect(url.format(cbUrl));
				});
				
			}
			
			next();
		});

	//OAuth token endpoint - return JWT token to client
	router.route('/token')
		.all(function(req, res, next){
			next();
		})
		.post(function(req, res, next){
			//THe POST request put all parameters by x-www-form-urlencoded
			
			switch(req.body.grant_type){
				case "code":
					var authCode = req.body.code,
						clientId = req.body.client_id,
						clientSecret = req.body.client_secret;

					//validate code and client
					AuthCode.validateAuthCode(authCode, 
						clientId, clientSecret, function(err, code, reason){

						if(err) throw err;

						if(!code){
							return res.json({
				        		success: false,
				        		error: reason,
				        		message: 'Failed to get token'
				        	});
						}
						

						//Generate JWT token
						var claims = {
						  sub: code.User.username,
						  iss: req.get('host'),
						  permissions: ['all','upload-photos']
						};

		        		var accessToken = jwt.sign(claims, secretKey
			        						, {
			        							expiresIn: ACCESS_TOKEN_EXPIRES_IN
			        						}
		        						);

		        		return res.json({
		        			success: true,
		        			access_token: accessToken,
		        			expires_in: ACCESS_TOKEN_EXPIRES_IN
		        		});

					})

					break;
				case "password":
					//TODO: validate the request is from a trusted client's domain
					var username = req.body.username,
						password = req.body.password,
						clientId = req.body.client_id;


					//validate username and password
					User.getAuthenticated(username, password, clientId, function(err, user, reason){
			        	if(err) throw err;

			        	if(user !== null){ //success

			        		
			        		//Generate JWT token
							var claims = {
							  sub: user.username,
							  iss: req.get('host'),
							  permissions: ['all','upload-photos'] //TODO: get permissions from user table
							};

			        		var accessToken = jwt.sign(claims, secretKey
				        						, {
				        							expiresIn: ACCESS_TOKEN_EXPIRES_IN
				        						}
			        						);
			        		

			        		return res.json({
			        			success: true,
			        			access_token: accessToken,
			        			expires_in: ACCESS_TOKEN_EXPIRES_IN
			        		});

			        	}else{
			        		return res.json({
				        		success: false,
				        		message: 'Login failed'
				        	});
			        	}
			        });
					break;
				default:
					return res.json({
						success: false,
						message: "Invalid grant type"
					});
			}
		});

	app.use('/oauth2', router);
}