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


	var GET_ALL_ASSETS_URL
		= 'https://qyapi.weixin.qq.com/cgi-bin/material/batchget?access_token=${accessToken}';

  var GET_ASSET_URL
    = 'https://qyapi.weixin.qq.com/cgi-bin/material/get?access_token=${accessToken}&media_id=${mediaId}&agentid=${agentId}';

  router.route("/get")
    .get(function(req, res, next){
      var mediaId = req.query.mediaId
        , agentId = req.query.agentid;

      var targetUrl = template(GET_ASSET_URL
          , { accessToken: app.locals.accessToken.accessToken, mediaId: mediaId, agentId: agentId });
      webRequest.get(targetUrl)
        .on('error', function(error){
            logger.error(error);
            return res.json({
              success: false
              , errors: [{
                code: error.errcode
                , message: error.errmsg
                , internalError: error
              }]
            })
        })
        .pipe(res);
    });

  /*
   * parameters
      "type": "image",
      "agentid": 1,
      "offset": 0,
      "count": 10
   */
	router.route("/")
	 	.post(function(req, res, next){
      debug("Body", req.body);

			var type      = req.body.atype || "image"
        , agentid   = req.body.agentid
        , offset    = req.body.offset || 0
        , count     = req.body.count || 50;

		var targetUrl = template(GET_ALL_ASSETS_URL
					, { accessToken: app.locals.accessToken.accessToken });

		webRequest.post(
      { url: targetUrl
        , headers: {'Content-Type': 'application/json'}
        , body: JSON.stringify({
              "type": type
              , "agentid": agentid
              , "offset": offset
              , "count": count
          })
      }
      , function(error, response, body){
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

	app.use('/v1/assets', router);
}
