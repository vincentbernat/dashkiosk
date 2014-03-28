'use strict';

var winston = require('winston'),
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

module.exports = logger;
