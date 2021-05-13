"use strict"

module.exports = function(app, settings){

	//-- Include Dependencies --//
	var log4js 				= require('log4js')
		, util 				= require('util')
		, csrf 				= require('csurf') // ref: https://github.com/expressjs/csurf
		, cookiee 			= require("cookie-encryption")
		, randomstring 		= require("randomstring")
		, models			= require("../../models")
		, url 				= require('url')
		, express 			= require('express');
		

	//-- Delcare Variables --//
	var  logger 			= log4js.getLogger('http')
		, csrfProtection 	= csrf({ cookie: true })
		, router 			= express.Router();

		

	router.route('/create')
		.all(function(req, res, next){
			models.Client.generateClient(function(err, client, clientSecretClearText){
				if(err) return res.json({ success:false, error: err });

				if(client !== null){
					return res.json({ success: true, clientId: client.clientId, clientSecret: clientSecretClearText });
				}else{
					return res.json({ success: false });
				}
			});
		});


	router.route('/reset')
		.all(function(req, res, next){
			//TODO: Conduct necessary authentication here - e.g. 3rd factor authentication
			return next();
		})
		.post(function(req, res, next){
			var clientId = req.body.client_id;

			Client.resetClientSecret(clientId, function(err, clientSecretClearText){
				if(err) return res.json({ success:false, error: err });

				if(clientSecretClearText){
					return res.json({ success: true, clientId: clientId, clientSecret: clientSecretClearText });
				}else{
					return res.json({ success: false });
				}
			});
		});

	app.use('/clients', router);
}