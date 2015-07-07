'use strict';

var express  = require('express'),
    methodOverride = require('method-override'),
    logger   = require('./logger'),
    auth       = require('http-auth'),
    config   = require('./config');

var app = module.exports = express();

// Configuration of Express.js
if (app.get('env') === 'development') {
  app.use(require('connect-livereload')({
    port: process.env.LIVERELOAD_PORT
  }));
}



if (config.get('forcessl')) {
  var forceSsl = function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
  return next();
  };
  app.use(forceSsl);
}

app.use(express.static(config.get('path:static')));
app.use(methodOverride());
logger.express.access(app);

if (config.get('auth:enabled')) {
  var basic = auth.basic({
    realm: config.get('auth:realm')
    }, function (username, password, callback) { // Custom authentication method. 
      callback(username === config.get('auth:username') && password === config.get('auth:password'));
    });
  app.use(auth.connect(basic));
}

app.use(app.router);
logger.express.error(app);

if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}
