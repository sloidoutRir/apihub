"use strict";

module.exports = function(sequelize, DataTypes) {
  var _       = require('lodash')
    , debug   = require('debug')('pg')
    , bcrypt  = require('bcrypt-as-promised')
    , SALT_WORK_FACTOR = 10
    , MAX_LOGIN_ATTEMPTS = 5
    , LOCK_TIME = 2 * 60 * 60 * 1000;


  var User = sequelize.define("User", {
    username: {
      type: DataTypes.STRING(1024)
      , allowNull: false
      , unique: true
      , validate: {
          len: [2,100]
        }
    }
    , password: {
      type: DataTypes.STRING(1024)
      , allowNull: false
    }
    //Account lockout properties
    // http://devsmash.com/blog/implementing-max-login-attempts-with-mongoose
    , loginAttempts: { 
      type: DataTypes.INTEGER
      , default: 0 
      , field: 'login_attempts'
    }
    , lockUntil: { 
      type: DataTypes.DATE
      , field: 'login_until'
    }
    , email: { 
      type: DataTypes.STRING
      , allowNull: true
      , unique: true
      , validate: {
          isEmail: true
        }
      , set: function(v) { 
        return this.setDataValue('email', _.toLower(v));
      }
    }
    , mobile: { //TODO: Add custom mobile phone format validation 
      type: DataTypes.STRING,
      unique: true
    }
    , origin: { //账号的注册来源 － 平台标准流程注册、微信、QQ、微博、支付宝、手机号注册
      type: DataTypes.ENUM,
      values: [ 'standard', 'wechat', 'qq', 'weibo', 'alipay', 'mobile' ]
    }
    , wechatId : { //微信用户的openid
      type: DataTypes.STRING
      , unique: true
      , field: 'wechat_id'
    }
    , wechatUnionId : {
      type: DataTypes.STRING
      , unique: true
      , field: 'wechat_union_id'
    }
    , wechatNickname : {
      type: DataTypes.STRING
      , field: 'wechat_nickname'
    }
    , wechatHeadimage : {
      type: DataTypes.STRING
      , field: 'wechat_headimage'
    }
    , activated: { 
      type: DataTypes.BOOLEAN, default: false 
    }
    , firstName: {
      type: DataTypes.STRING, field: 'first_name'
    }
    , lastName: {
      type: DataTypes.STRING, field: 'last_name'
    }
  }, {
    classMethods: {
      associate: function(models){
        
      }
      , getAuthenticated: function(username, password, cb) {
            this.find({ where: { username: username } })
                .then(function(user) {
                    //check if user exists!
                    if(!user){
                      return cb(null, null, reasons.NOT_FOUND);
                    }

                    // check if the account is currently locked
                    if (user.isLocked) {
                        // just increment login attempts if account is already locked
                        return user.incLoginAttempts(function(err) {
                            if (err) return cb(err);
                            return cb(null, null, reasons.MAX_ATTEMPTS);
                        });
                    }

                    debug("hashed password: ", user.password);
                    // test for a matching password
                    return user.comparePassword(password)
                            .then(function() {
                                // if there's no lock or failed attempts, just return the user
                                //if (!user.loginAttempts && !user.lockUntil) return cb(null, user);

                                // reset attempts and lock info
                                return user.update(
                                    {
                                        loginAttempts: 0
                                        , lockUntil: 1
                                    }
                                );
                            })
                            .then(function(user){
                                return cb(null, user);
                            })
                            .catch(bcrypt.MISMATCH_ERROR, function(err){
                                debug(err);
                                // password is incorrect, so increment login attempts before responding
                                return user.incLoginAttempts(function(err) {
                                    if (err) return cb(err);
                                    return cb(null, null, reasons.PASSWORD_INCORRECT);
                                });
                            });
                })
                .catch(function(err) {
                    return cb(err);
                });
      }
    },
    instanceMethods: {
      comparePassword: function(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
      }
      , incLoginAttempts: function(cb) {
          // if we have a previous lock that has expired, restart at 1
          if (this.lockUntil && this.lockUntil < _.now()) {
            this.loginAttempts = 1; //Clear the counter
            this.lockUntil = null;
            this.updateAttributes({
              loginAttempts: this.loginAttempts + 1,
              lockUntil: _.now() - 1
            }).then(function(user){
              debug('saved success', user);
              cb(null);
            }).catch(function(err){
              cb(err);
            });
          }else{
            // lock the account if we've reached max attempts and it's not locked already
            if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
                this.updateAttributes({
                  lockUntil:  _.now() + LOCK_TIME
                }).then(function(user){
                  debug('saved success', user);
                  cb(null);
                }).catch(function(err){
                  cb(err);
                });
            }
          }
          return cb(null);
      }
    },
    getterMethods: {
      isLocked: function() { return !!(this.lockUntil && this.lockUntil > Date.now()); }
    }
  });

  // expose enum on the model
  // http://devsmash.com/blog/implementing-max-login-attempts-with-mongoose
  // Login failure reasons, only 3 is reasonable
  // 1. The specified user was not found in the database
  // 2. The provided password was incorrect
  // 3. The maximum number of login attempts has been exceeded
  var reasons = User.failedLogin = {
      NOT_FOUND: 0,
      PASSWORD_INCORRECT: 1,
      MAX_ATTEMPTS: 2
  };

  var hashPasswordHook = function(instance, options, cb) {
    if (!instance.changed('password')) return cb(null);
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR)
        .then(function(salt) {
          // hash the password using our new salt
          //We don't need to persist the SALT because it has already been incorprated into the hash
          // http://stackoverflow.com/questions/277044/do-i-need-to-store-the-salt-with-bcrypt
          return bcrypt.hash(instance.password, salt);
        })
        .then(function(hash) {
          instance.set('password', hash);
          return cb(null, options);
        })
        .catch(function(err){
          return cb(err);
        });
  };

  User.beforeCreate(hashPasswordHook);
  User.beforeUpdate(hashPasswordHook);

  return User;
};