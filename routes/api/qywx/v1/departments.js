module.exports = function(app, settings){
	var log4js 	 = require('log4js')
		, _				 = require('lodash')
		, debug 	 = require('debug')('qywx-api')
		, webRequest  = require('request')
    , template    = require('es6-template-strings')
		, util 		 = require('util')
		, express  = require('express');


	var logger 	    = log4js.getLogger("qywx-api")
		, router 	    = express.Router();


	var GET_DEPARTMENTS_URL
		= 'https://qyapi.weixin.qq.com/cgi-bin/department/list?access_token=${accessToken}&id=${departId}';

	router.route("/")
	 	.get(function(req, res, next){
			var departId = req.query.id || 1;

		debug(app.locals.accessToken);

		var targetUrl = template(GET_DEPARTMENTS_URL
					, { accessToken: app.locals.accessToken.accessToken, departId: departId});

		webRequest.get(targetUrl, function(error, response, body){
			if(error){
				logger.error(error);
				return res.json({
					success: false
					, errors: [{
						code: error.errcode
						, message: error.errmsg
						, internalError: error
					}]
				})
			}
			var data = JSON.parse(body);
			debug(" console.log ", body);
			return res.json(data);
		});
	});

	app.use('/v1/departments', router);
}
