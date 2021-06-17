module.exports = function(app, settings){
	var log4js 	 = require('log4js')
		, _				 = require('lodash')
		, debug 	 = require('debug')('qywx-api')
		, webRequest  = require('request')
		, util 		 = require('util')
		, express  = require('express')
    , models   = require('../../../../models');


	var logger 	    = log4js.getLogger("qywx-api")
		, router 	    = express.Router();



	router.route("/")
    .get(function(req, res, next){
      //Search account lists
      return res.status(501).json({
        success: false,
        errCode: 501,
        errMsg: 'not_implemented'
      })
    })
    .post(function(req, res, next){
      //Create account
      var corpId    = req.body.corpId
        ,appSecret  = req.body.appSecret
        ,name       = req.body.name;

      models.QywxAccount.create({
        corpId: corpId
        ,appSecret: appSecret
        ,name: name
      })
      .then(function(account){
        return res.status(201).json({
          success: true
          ,data: account.toJSON()
        });
      })
      .catch(function(err){
        return res.status(501).json({
          success: false,
          errCode: 501,
          errMsg: 'failed_to_create_account',
          error: err
        });
      });
    })
    .put(function(req, res, next){
      //Update account
      return res.status(501).json({
        success: false,
        errCode: 501,
        errMsg: 'not_implemented'
      });
    });

	app.use('/v1/accounts', router);
}
