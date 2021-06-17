"user strict"

module.exports = function(sequelize, DataTypes){
	var _       = require('lodash')
    , debug   	= require('debug')('pg');


    var VerificationCode = sequelize.define('VerificationCode', {
    	identity: {
            type: DataTypes.STRING
            , allowNull: false
			}
			,veriCode: { //TODO: AppSecrect should be hashed then saved in db
          type: DataTypes.STRING
          , allowNull: false
          , field: 'veri_code'
      }
			,expiresAt: {
          type: DataTypes.DATE
          , allowNull: false
          , field: 'expires_at'
      }
			,used: {
				type: DataTypes.BOOLEAN
				,allowNull: false
				,defaultValue: false
				,field: 'used'
			}
    }, {
    	classMethods: {

    	}
    });

    return VerificationCode;
}
