"use strict";

module.exports = function(sequelize, DataTypes){
	//-- Include Dependencies --//
	var _ 				= require('lodash')
		, bcrypt	 	= require('bcrypt-as-promised')
		, debug 		= require('debug')('pg')
		, randomstring 		= require("randomstring");

	//-- Delcare Variables --//
	var  SALT_WORK_FACTOR 	= 10
		, reasons 			= {
								INVALID_CREDENTIAL: 0,
								CODE_EXPIRES: 1
							};


	var AuthCode = sequelize.define('AuthCode'
		, {
			code: { type: DataTypes.STRING, allowNull: false, unique: true }
			, dateExpires: { type: DataTypes.DATE, allowNull: false
							, defaultValue: function(){
								return _.now() + CODE_EXPIRES;
							}
							, field: 'date_expires'
						}
		}
		, {
			classMethods: {
				associate: function(models) {
					AuthCode.belongsTo(models.Client, {
					  onDelete: "CASCADE",
					  foreignKey: {
					    allowNull: false
					  }
					});
					AuthCode.belongsTo(models.User, {
						foreignKey: {
							allowNull: false
						}
					});
				}
				, generateAuthCode: function(clientId, userId, cb){
					// generate a salt
					bcrypt.genSalt(SALT_WORK_FACTOR)
						.then(function(salt) {
					        // hash the password using our new salt
					        //We don't need to persist the SALT because it has already been incorprated into the hash
					        // http://stackoverflow.com/questions/277044/do-i-need-to-store-the-salt-with-bcrypt
					        return bcrypt.hash(randomstring.generate(), salt);
				    	})
				    	.then(function(hash) {
				            // override the cleartext password with the hashed one
				            return AuthCode.create({
				            	code: hash,
								client_id: clientId,
								user_id: userId
							});
				        })
				        .then(function(authCode){
				        	return cb(null, authCode);
				        })
				        .catch(function(err){
				        	return cb(err);
				        });
				}
				, validateAuthCode: function(code, clientId, clientSecret, cb){
					AuthCode.find({ 
							where: { code: code }
							, include: [ sequelize.models.User, sequelize.models.Client ] 
						})
						.then(function(authCode){
							if(!authCode) 
								return cb(null, null, reasons.INVALID_CREDENTIAL); 

							if(authCode.isExpired)
								return cb(null,  null, reasons.CODE_EXPIRES);

							return authCode.client.compareSecret(clientSecret, function(err, isMatch){
								if(err) return cb(err);


								if(!isMatch)
									return cb(null, null, reasons.INVALID_CREDENTIAL); 

								return cb(null, authCode);
							});
						})
						.catch(function(err){
							return cb(err);
						});
				}
			}
			, getterMethods: {
				isExpired: function() { return !(this.dateExpires > _.now()); }
		    }
		}
	);

	//-- Set extra HELPER object properties --//
	AuthCode.authFailed = reasons;

	return AuthCode;
}