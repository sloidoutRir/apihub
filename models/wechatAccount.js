"user strict"

module.exports = function(sequelize, DataTypes){
	var _       = require('lodash')
    , debug   	= require('debug')('pg');


    var WechatAccount = sequelize.define('WechatAccount', {
    	appId: { 
            type: DataTypes.STRING
            , allowNull: false
            , unique: true
            , field: 'app_id'
		}
        , appSecret: { //TODO: AppSecrect should be hashed then saved in db
            type: DataTypes.STRING
            , field: 'app_secret'
        }
        , name: {
            type: DataTypes.STRING
            , unique: true
        }
    }, {
    	classMethods: {
    		associate: function(models){
                WechatAccount.hasMany(models.Client, {
                    onDelete: "SET NULL",
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
    	}
    });

    return WechatAccount;
}