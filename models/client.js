"use strict"

module.exports = function(sequelize, DataTypes){
	//-- Include Dependencies --//
	var   _ 				= require("lodash")
		, bcrypt	 		= require('bcrypt-as-promised') //A promise version of bcrypt
		, randomstring 		= require("randomstring")
		, debug				= require('debug')('pg')
		, ObjectID 			= require("bson-objectid");

	//-- Delcare Variables --//
	var SALT_WORK_FACTOR 	= 10;

	var Client = sequelize.define('Client'
		,{
			clientId: { type: DataTypes.STRING, allowNull: false, unique: true
						, field: 'client_id' },
			clientSecret: { type: DataTypes.STRING, allowNull: false 
						, field: 'client_secret' },
			callback: { type: DataTypes.STRING },
			name: { type: DataTypes.STRING, allowNull: false, defaultValue:'' },
			logo: { type: DataTypes.STRING }
		}
		,{
			classMethods: {
				resetClientSecret: function(clientId, cb){
					var self = this;
					var clientSecretClearText = randomstring.generate();
					// generate a salt
					this.find({ where: { clientId: clientId } })
						.then(function(client){
							if(!client)
								return cb(null, null, reasons.NOT_FOUND);

							//Do client secret resetting 
							return bcrypt.genSalt(SALT_WORK_FACTOR);
						})
						.then(function(salt) {
					        // hash the password using our new salt
					        // We don't need to persist the SALT because it has already been incorprated into the hash
					        // http://stackoverflow.com/questions/277044/do-i-need-to-store-the-salt-with-bcrypt
					        return bcrypt.hash(clientSecretClearText, salt);
					    })
					    .then(function(hash) {

				            return client.update({
					            clientSecret: hash 
					        });
					    })
						.then(function(client){
							return cb(null, clientSecretClearText);
						})
						.catch(function(err){
							return cb(err);
						});
				}
				, generateClient: function(cb){
					var clientSecretClearText = randomstring.generate();
					// generate a salt
				    bcrypt.genSalt(SALT_WORK_FACTOR)
				    	.then(function(salt) {
					       debug("salt: ", salt);
					        // hash the password using our new salt
					        //We don't need to persist the SALT because it has already been incorprated into the hash
					        // http://stackoverflow.com/questions/277044/do-i-need-to-store-the-salt-with-bcrypt

					        return bcrypt.hash(clientSecretClearText, salt);
					    })
					    .then(function(hash) {
					    	debug("hash: ", hash);

				            // override the cleartext password with the hashed one
				            return Client.create({
								clientId: ObjectID().toString(),
								clientSecret: hash
							});
				        })
				        .then(function(client){
				        	return cb(null, client, clientSecretClearText);
				        })
				        .catch(function(err){
				        	debug("Create Client Error: ", err);
				        	return cb(err);
				        });
				}
			}
			, instanceMethods: {
				compareSecret: function(candidateSecret, cb) {
					bcrypt.compare(candidateSecret, this.clientSecret, function(err, isMatch) {
					    if (err) return cb(err);
					    cb(null, isMatch);
					});
				}
			}
		});


	return Client;
}