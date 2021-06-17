module.exports = function(app, settings){
	var log4js 	    = require('log4js')
    , _           = require('lodash')
		, debug 	    = require('debug')('qywx-api')
		, express     = require('express')
    , util        = require('util')
    , webRequest  = require('request')
    , template    = require('es6-template-strings')
    , models      = require("../../../models");


	var logger 	    = log4js.getLogger("qywx-api")
		, router 	    = express.Router()
    , GET_ACCESS_TOKEN_URL = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}';

  // var config = settings.subappConfig = {
  //   corpId: 'wx42c1a7f89c4a258d'
  //   , corpSecret: '2S3Pnsc7-kH8N8YCJ1OaBZn1wx5NUj1IIkjQ7gzt-q4580v_l6cQk_3d75B1oEw6'
  //   , name: 'APIHUB'
  // };

  function AccessTokenWrapper(accessToken, expiresAt){
    if( this instanceof AccessTokenWrapper){
      this.accessToken = accessToken;
      this.expiresAt = expiresAt;
      this.isSyncing = false;
      this.isExpiring = function(){ //If expiring started to retrieve token again
        return _.now() > (this.expiresAt - 3000000);
      }
			this.isExpired = function(){
				return _.now() > this.expiresAt;
			}
      return this;
    }else{
      return new AccessTokenWrapper(accessToken, expiresAt);
    }
  };

	require('./v1/Accounts')(app, settings);

  app.use(function(req, res, next){
      debug('Access To qywx API');

			var corpId = req.query.corpId || req.params.corpId || req.body.corpId;

      if(!app.locals.accessToken){
        app.locals.accessToken = AccessTokenWrapper(null, _.now());
      }
      /*
       * Retrieve and Cache AccessToken in memory
       */
      if(!app.locals.accessToken.accessToken || app.locals.accessToken.isExpiring()){
					models.QywxAccessToken.getToken(corpId, function(err, instance){
						if(err) {
							return res.status(500).json({
								success: false
								,errCode: 500
								,errMsg: err.message
								,error: err
							})
						}

						if(!instance){
							//retrieve token from server then save back to db
							//Step-1 lock the record
							models.QywxAccessToken.upsert({
								corpId: corpId
								, accessToken: ''
								, expiresAt: _.now()
								, isLocked: true
							})
							.then(function(instance){
								//Step-2 get appSecret
								return models.QywxAccount.findOne({
									where: { corpId: corpId }
								});
							})
							.then(function(instance){
								if(!instance){
									return res.status(500).json({
										success: false
										,errCode: 500
										,errMsg: 'invalid_corpid'
									});
								}

								var corpId = instance.corpId;
								var appSecret = instance.appSecret;
								//Step-3 retrieve access_token
								var targetUrl = template(GET_ACCESS_TOKEN_URL
		                      , { corpId: corpId, corpSecret: appSecret });

		            webRequest.get(targetUrl, function(error, response, body){
		  						if(error){
		  							logger.error(error);
		                return res.json({
		                  success: false
		      						, errors: [{
		      							code: 12345
		      							, message: error.message
		      							, internalError: error
		      						}]
		                })
		  						}

									debug(" console.log ", body);
		              var data = JSON.parse(body);

									////Step-4 save token back to db and unlock record
									//models.QywxAccessToken.update({})
									models.QywxAccessToken.setToken(corpId, data.access_token, data.expires_in
												, function(err){
													if(err) throw err;
													app.locals.accessToken
						                    = AccessTokenWrapper(data.access_token, _.now() + data.expires_in);
													return next();
												});

		            });

							})
							.catch(function(err){
								debug(err);
								return res.status(500).json({
									success: false
									,errCode: 500
									,errMsg: err.message
									,error: err
								});
							});

						} else {
							//save token to app.locals
							app.locals.accessToken = AccessTokenWrapper(instance.accessToken, instance.expiresAt);
							return next();
						}
					});
      }else{
        return next();
      }
  });


  require('./v1/departments')(app, settings);
  require('./v1/assets')(app, settings);
	require('./v1/employees')(app, settings);
}
