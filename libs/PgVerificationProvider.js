"user strict"

var self = module.exports = function(options){
  var _       = require('lodash')
    ,debug    = require('debug')('apihub')
    ,randomstring = require('randomstring')
    ,models   = require('../models')
    ,VerificationCode = models.VerificationCode;


  return {
    generate: function(identity, expires, done){
      //1. search existing code, if does exist and not expired or used then return error
      //   to prompt the user he/she was rate limited, please wait for x seconds (expiresAt - _.now())
      VerificationCode.findOne({
        where: { identity: identity, used: false, expiresAt: { $gt: _.now() } }
      })
      .then(function(found){
        if(!found){
          var veri_code = randomstring.generate({
            length: 4,
            charset: '1234567890'
          });
          return VerificationCode.create({
            identity: identity
            ,veriCode: veri_code
            ,used: false
            ,expiresAt: _.now() + expires
          })
        }else{
            return done(new Error('rate_limiting_reached_please_wait_for_' + (found.expiresAt - _.now())/1000 + "s" ));
        }
      })
      .then(function(created){
        return done(null, created.veriCode);
      })
      .catch(function(err){
        return done(err);
      });
    }
    ,validate: function(identity, code, done){
        VerificationCode.findOne({
            where: { identity: identity, veriCode: code, used: false, expiresAt: { $gt: _.now() } }
        })
        .then(function(found){
          if(!found) return done(new Error('invalid_code_or_expired'));
          //Should also delete the record
          var token = randomstring.generate(64);
          return done(null, token);
        })
        .catch(function(err){
          return done(err);
        });
    }
  }
}
