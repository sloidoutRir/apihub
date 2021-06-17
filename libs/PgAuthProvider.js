"user strict"

var self = module.exports = function(options){
  var _       = require('lodash')
    ,debug    = require('debug')('pg')
    ,models 	= require('../models');

  return {
    authenticate: function(username, password, done){
      models.User.getAuthenticated(username, password
        ,function(err, user, reason){
            if(err) return done(err, null);

            if(!user) return done(new Error('invalid_credential'), null);

            return done(null, user);
        });
    }
    ,authenticateCode: function(code, clientId, clientSecret, done){
      return done(null, {});
    }
    ,register: function(account, options, done){
      return done(null, account);
    }
  }
}
