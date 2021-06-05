/**
* Wechat Login and Regsiter Handler
*/

module.exports = function(app, settings){
	var log4js 		= require('log4js')
		, logger 	= log4js.getLogger('http')
		, debug		= require('debug')('http')
		, util 		= require('util')
		, csrf 		= require('csurf') // ref: https://github.com/expressjs/csurf
		, cookiee 	= require("cookie-encryption")
		, randomstring = require("randomstring")
		, jwt 		= require('jsonwebtoken')
		, models 	= require('../../models')
		, url 		= require('url')
		, webRequest = require('request')
    	, ObjectID  = require("bson-objectid")
		, express 	= require('express');


	var csrfProtection 	= csrf({ cookie: true })
		, ACCESS_TOKEN_EXPIRES_IN 	= 24 * 60 * 60 		//In seconds e.g. 24hours = 24*60*60
		, secretKey 	= settings.config.jwt.secret 	// JWT SEcret token - 
													 	// TODO: Should use different secret for different account
		, router 		= express.Router();
	
	//If user identity validated then set cookie and redirect to returnUri
	var accountCookieName = settings.config.accountCookie.name;


	var composeJwtToken = function(user, options){
		var claims = {
			sub: user.username
			, nickname: user.wechatNickname
			, headimage: user.wechatHeadimage
			, iss: options.issuer
			, permissions: ['all'] //TODO: permissions management
		};

		var token 
			= jwt.sign(claims, options.secretKey
					, {
						expiresIn: options.expiresIn
					}
				);
    	
		return token;
	}

	/** 
	 *	http://identity.aivics.net/identity/wechat/auth?response_type=token&
  	 *					client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=userinfo
  	 *  @param response_type must be token
  	 *  @param client_id must be a valid client id
  	 *  @param callback the callback url
  	 *  @param scope - not used at this moment
	 */
	router.route('/auth')
		.get(function(req, res, next){
			var accountCookie 	= req.signedCookies[accountCookieName]
				, appId 		= req.query.appid 	   //optional - appid of wechat
				, clientId 		= req.query.client_id  //Optional - cilentid from us
				, callback 		= req.query.callback;

			//TODO: Should also check the referer domain name to get the right appid
			debug("Hostname: " , req.hostname);

			if(!callback) throw Error("Invalid callback!");

			var redirectUri = url.parse(callback, true);

			models.UserSession.getAuthenticated(accountCookie
		    	, function(err, user, reason){
					if(err || !user.wechatId ) {
						debug(" User not logged in because: " + err);

						//The cookie is invalid or auth failed
						//So we need to do login process in wechat
						//Compose the auth code request 
						//Generate JWT token

						//try to get appid from clientid

						// https://open.weixin.qq.com/connect/oauth2/authorize?
						//   appid=APPID&redirect_uri=REDIRECT_URI&response_type=code
						//   &scope=SCOPE&state=STATE#wechat_redirect
						var wechatAuthUrl = 
								url.parse("https://open.weixin.qq.com/connect/oauth2/authorize", true);


						wechatAuthUrl.query.appid = appId; //"wxa0c45fc6d9e269ed";
						wechatAuthUrl.query.redirect_uri 
											  = url.format({
													protocol: req.get('X-Forwarded-Proto') || req.protocol
													, hostname: req.hostname
													, pathname: "/identity/wechat/callback"
													, query: {
														cb: url.format(redirectUri)
														, appid: appId
													}
												});
						wechatAuthUrl.query.response_type = 'code',
						wechatAuthUrl.query.scope = 'snsapi_userinfo',
						wechatAuthUrl.query.state = randomstring.generate(),
						wechatAuthUrl.hash = 'wechat_redirect';

						var targetUrl = url.format(wechatAuthUrl);
						debug(targetUrl);

						return res.redirect(targetUrl);

					}else{
						// TODO: we must check ClientID then get the right client secret to hash the JWT token
						//User cookie is valid we got the user info
						// Redirect back w/ JWT token as parameter
						var claims = {
							sub: user.username
							, nickname: user.wechatNickname
							, headimage: user.wechatHeadimage
							, iss: req.hostname
							, permissions: ['all'] //TODO: permissions management
						};

		        		var accessToken 
		        			= jwt.sign(claims, secretKey
	        						, {
	        							expiresIn: ACCESS_TOKEN_EXPIRES_IN
	        						}
        						);
			        	
						redirectUri.params.token = accessToken;

						debug("got access token: ", accessToken);
				    	var returnUrl = url.format(redirectUri);
				    	debug("return url: ", returnUrl);

				    	return res.redirect(returnUrl);
					}

				}
			);

		});
	
	router.route('/callback')
		.get(function(req, res, next){
			
			var callback 	= req.query.cb
				, code 		= req.query.code
				, state 	= req.query.state
				, appId 	= req.query.appid;

			var redirectUri = url.parse(callback, true);

			debug("original callback: ", callback);

			models.WechatAccount.find({ where: { appId: appId } })
				.then(function(wechat){
					if(!wechat)
						return next(new Error("Not valid appid"));

					// 获取code后，请求以下链接获取access_token： 
					// https://api.weixin.qq.com/sns/oauth2/access_token
					// 		?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
					var targetUrl = "https://api.weixin.qq.com/sns/oauth2/access_token?"
									+ "appid=" + wechat.appId
									+ "&secret=" + wechat.appSecret
									+ "&code=" + code
									+ "&grant_type=authorization_code"
					debug("url to get wechat access token ", targetUrl);

					webRequest.get(targetUrl, function(error, response, body){
						if(error){
							logger.error(error); 
							return next(error);  //TODO: SHould provide a nice look error page 
						}

						/** If everything goes well, we should get below json data:
						* {
						*	   "access_token":"ACCESS_TOKEN",
						*	   "expires_in":7200,
						*	   "refresh_token":"REFRESH_TOKEN",
						*	   "openid":"OPENID",
						*	   "scope":"SCOPE"
						*	}
						*/
						debug("response: ", body);
						var data = JSON.parse(body);
						if(data.errcode){
							return next(new Error(data.errmsg));
						}

						var wxAccessToken 		= data.access_token
							, wxExpiresIn 		= data.expires_in
							, wxRefreshToken 	= data.refresh_token
							, wxOpenId 			= data.openid
							, scope 			= data.scope;

						//Try to get user info
						// http：GET（请使用https协议）
						// https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN
						var getUserInfoUri = "https://api.weixin.qq.com/sns/userinfo"
											+ "?access_token=" + wxAccessToken
											+ "&openid=" + wxOpenId
											+ "&lang=zh_CN";	//Language should be dynamica ??

						debug("getuserinfo: ", getUserInfoUri);

						webRequest.get(getUserInfoUri, function(error, response, body){
							//Right response
							/**
							{
							   "openid":" OPENID",
							   "nickname": NICKNAME,
							   "sex":"1",
							   "province":"PROVINCE"
							   "city":"CITY",
							   "country":"COUNTRY",
							    "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46", 
								"privilege":[
									"PRIVILEGE1"
									"PRIVILEGE2"
								],
							    "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
							}
							*/

							//Use the body parameter to update wechat account informaiton
							// If there is no existing wechat account we need create a new one
							// If there is alreay existing wechat account, update the account
							var data = JSON.parse(body);
							debug("user info: ", data.errcode);
							if(data.errcode){
								return next(new Error(data.errmsg));
							}

							var uOpenid			= data.openid
								, uNickname		= data.nickname
								, uSex 			= data.sex
								, uProvince 	= data.province
								, uCity 		= data.city
								, uCountry 		= data.country
								, uHeadimgurl	= data.headimgurl
								, uPrivilege 	= data.privilege
								, uUnionId 		= data.unionid;

							models.User.find({ where: { wechatId: wxOpenId } })
								.then(function(user){
									if(!user){
										//We need create new user
										models.User.create({
											username: "wechat_" + ObjectID()
											, password: randomstring.generate()
											, wechatId: uOpenid
											, wechatNickname : uNickname
											, wechatHeadimage : uHeadimgurl
											, wechatUnionId: uUnionId
										})
										.then(function(user){
											//finally componse JWT token and send back to origin request callback
											redirectUri.query.token = composeJwtToken(user, { 
																		expiresIn: ACCESS_TOKEN_EXPIRES_IN
																		, secretKey: secretKey
																		, issuer: req.hostname
																	});
									    	var returnUrl = url.format(redirectUri);
									    	debug("return url: ", returnUrl);

									    	return res.redirect(returnUrl);
										})
										.catch(function(err){
											//Show error page
											logger.error(err);
											return next(err);
										});
									}else{
										//Update existing user
										user.update({
											wechatNickname : uNickname
											, wechatHeadimage : uHeadimgurl
										})
										.then(function(user){
											//finally componse JWT token and send back to origin request callback
											redirectUri.query.token = composeJwtToken(user, { 
																		expiresIn: ACCESS_TOKEN_EXPIRES_IN
																		, secretKey: secretKey
																		, issuer: req.hostname
																	});
									    	var returnUrl = url.format(redirectUri);
									    	debug("return url: ", returnUrl);

									    	return res.redirect(returnUrl);
										})
										.catch(function(err){
											logger.error(err);
											return next(err);
										});
									}

								})
								.catch(function(err){
									//TODO: If any error, go to error page
									logger.error(err);
									return next(err);
								});
						});
					});
				});
		});	
	


	app.use('/wechat', router);
}