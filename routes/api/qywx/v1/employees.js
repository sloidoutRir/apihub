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


	var GET_EMPLOYEES_URL
		= 'https://qyapi.weixin.qq.com/cgi-bin/user/list?access_token=${accessToken}'
      +'&department_id=${departmentId}&fetch_child=${fetchChild}&status=${status}';

	router.route("/")
	 	.get(function(req, res, next){
			var departmentId = req.query.departmentId || 1
        , fetchChild = req.query.fetchChild || 0
        , status = req.query.status || 4;


		var targetUrl = template(GET_EMPLOYEES_URL
					, { accessToken: app.locals.accessToken.accessToken
              , departmentId: departmentId, fetchChild: fetchChild, status: status });

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

	app.use('/v1/employees', router);
}
