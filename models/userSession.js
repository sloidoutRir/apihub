module.exports = function(sequelize, DataTypes) {
	var Sequelize = require("sequelize");
	var _ = require('lodash');
	var debug = require('debug')('pg'),
		SESSION_EXPIRES = 30 * 24 * 60 * 60 * 1000; //in ms, 30days

	var reasons = {
	    NOT_FOUND: 0,
	    EXPIRE: 1
	};

	var UserSession = sequelize.define("UserSession", {
		sid: { 
			type: DataTypes.STRING
			, allowNull: false
			, unique: true 
		}
		,dateExpires: { 
			type: DataTypes.DATE
			, allowNull:false
			, defaultValue: function() {
				debug(_.now());
				return _.now() + SESSION_EXPIRES;
			}
			, field: 'date_expires'
		}
	}, {
		classMethods: {
			associate: function(models) {
				UserSession.belongsTo(models.User, {
				  onDelete: "CASCADE",
				  foreignKey: {
				    allowNull: false
				  }
				});
			}
			,getAuthenticated: function(sid, cb){
				debug("Find user by sid: " + sid);

				UserSession.find({ 
						where: { sid: sid }
						, include: [{
							model: sequelize.models.User
							, attributes: {
								exclude: ['password']
							}
							, include: [{
								model: sequelize.models.Account
							}]
						}] 
					 })
					.then(function(userSession){
						if(!userSession)
							return cb(new Error("USER NOT FOUND"), null, reasons.NOT_FOUND);

						if(userSession.isExpired)
							return cb(new Error("SESSION EXPIRES"), null, reasons.EXPIRE);

						return cb(null, userSession.User.toJSON());
					}
					, function(err){
						return cb(err);
					});
			}
		}
		,getterMethods: {
			isExpired: function() { return !(this.dateExpires > _.now()); }
	    }
	});

	return UserSession;
} 