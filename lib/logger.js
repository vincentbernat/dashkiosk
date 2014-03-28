'use strict';

var _ = require('lodash'),
    winston = require('winston'),
    expressWinston = require('express-winston'),
    config  = require('./config');

var console = new winston.transports.Console({
  prettyPrint: true,
  colorize: true,
  silent: false,
  timestamp: false,
  handleExceptions: true,
  level: config.logLevel
});
var logger = new winston.Logger({
  transports: [ console ]
});

logger.express = {
  error: function(app) {
    app.use(expressWinston.errorLogger({
      transports: [ console ]
    }));
  },

  access: function(app) {
    app.use(expressWinston.logger({
      transports: [ console ]
    }));
  }
};

logger.exception = function(message, err) {
  var moreArgs = [].slice.apply(arguments).slice(2);
  var info = {};
  moreArgs.unshift(_.extend({
    stack:   err.stack && err.stack.split('\n')
  }, err));
  moreArgs.unshift(message);
  return logger.error.apply(logger, moreArgs);
};

module.exports = logger;
