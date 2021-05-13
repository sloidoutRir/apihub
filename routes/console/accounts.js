module.exports = function(app, settings){
	var debug 		= require('debug')('console')
		, express 	= require('express')
		, util 		= require('util')
		, url 		= require('url')
		, csrf 		= require('csurf') // ref: https://github.com/expressjs/csurf
		, cls 		= require('../../libs/continuationLocalStorage')
		, randomstring = require("randomstring")
		, csrfProtection = csrf({ cookie: true });

	var router 		= express.Router()
		, namespace = cls.getNamespace();

	router.route('/')
		.get(function(req, res, next){
			var principal = namespace.get("principal"); //User principal 
			debug(" thread local : " + namespace.get("principal"));
		    return res.render('account', { title: '账户信息', principal: principal });
		});

	app.use('/accounts', router);
}