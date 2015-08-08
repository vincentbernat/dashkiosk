'use strict';

var express  = require('express'),
    expressStatic = require('serve-static'),
    expressErrorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    auth     = require('http-auth'),
    template = require('./template'),
    logger   = require('./logger'),
    config   = require('./config');

var app = module.exports = express();

// Configuration of Express.js
if (app.get('env') === 'development') {
  app.use(require('connect-livereload')({
    port: process.env.LIVERELOAD_PORT
  }));
}



if (config.get('forcessl')) {
  var forceSsl = function(req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
  return next();
  };
  app.use(forceSsl);
}

app.use(template(config.get('path:static'), { branding: config.get('branding') }));
app.use(expressStatic(config.get('path:static'), { extensions: ['html'] }));
app.use(methodOverride());

if (config.get('auth:enabled')) {
  var basic = auth.basic({
    realm: config.get('auth:realm')
  }, function(username, password, callback) {
    // Custom authentication method.
    callback(username === config.get('auth:username') &&
             password === config.get('auth:password'));
  });
  app.use(auth.connect(basic));
}

logger.express.access(app);
logger.express.error(app);

if (app.get('env') === 'development') {
  app.use(expressErrorHandler());
}
