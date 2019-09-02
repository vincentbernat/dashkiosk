'use strict';

var _ = require('lodash'),
    winston = require('winston'),
    expressWinston = require('express-winston'),
    config  = require('./config');

var commonLogOptions = {
  prettyPrint: false,
  handleExceptions: true,
  level: config.get('log:level'),
  json: true,
  stringify: function(obj) { return JSON.stringify(obj); }
},
    transports = [
  new winston.transports.Console(_.merge({
    silent: false
  }, commonLogOptions))
];

if (config.get('log:file')) {
  transports.push(
    new winston.transports.File(_.merge({
      filename: config.get('log:file')
    }, commonLogOptions))
  );
}

var logger = new winston.Logger({
  transports: transports
});

logger.express = {
  error: function(app) {
    app.use(expressWinston.errorLogger({
      transports: transports
    }));
  },

  access: function(app) {
    app.use(expressWinston.logger({
      transports: transports
    }));
  }
};

logger.exception = function(message, err) {
  var moreArgs = [].slice.apply(arguments).slice(2);
  if (!err || !(err instanceof Error) || !err.stack) {
    moreArgs.unshift(err);
  } else {
    moreArgs.unshift(_.extend({
      stack:   err.stack && err.stack.split('\n'),
      message: err.message
    }, err));
  }
  moreArgs.unshift(message);
  return logger.error.apply(logger, moreArgs);
};

module.exports = logger;
