"user strict"

module.exports = function(sequelize, DataTypes){
	var _       = require('lodash')
    , debug   	= require('debug')('pg');


    var QywxAccessToken = sequelize.define('QywxAccessToken', {
    	corpId: {
            type: DataTypes.STRING
            , allowNull: false
            , unique: true
            , field: 'app_id'
			}
			,accessToken: { //TODO: AppSecrect should be hashed then saved in db
          type: DataTypes.STRING
          , field: 'access_token'
      }
			,expiresAt: {
          type: DataTypes.DATE
          , allowNull: false
          , field: 'expires_at'
      }
      ,isLocked: {
        type: DataTypes.BOOLEAN
        ,allowNull: false
        ,defaultValue: false
        ,field: 'is_locked'
      }
    }, {
    	classMethods: {
        getToken: function(corpId, done){
            QywxAccessToken.findOne({
              where: { corpId: corpId, expiresAt: { $gt: _.now() } }
            })
            .then(function(instance){
              return done(null, instance);
            })
            .catch(function(err){
              debug(err);
              return done(err, null);
            })
        }
        ,setToken: function(corpId, token, expiresIn, done){
          QywxAccessToken.upsert({
            corpId: corpId
            ,accessToken: token
            ,expiresAt: _.now() + expiresIn * 1000
            ,isLocked: false
          })
          .then(function(instance){
            return done(null);
          })
          .catch(function(err){
            return done(err, null);
          })
        }
    	}
    });

    return QywxAccessToken;
}
