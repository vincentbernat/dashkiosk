'use strict';

var winston = require('winston'),
    expressWinston = require('express-winston'),
    config  = require('./config');

var logger = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      timestamp: true,
      handleExceptions: true,
      level: config.logLevel
    })
  ]
});

logger.cli();

logger.express = {
  error: function(app) {
    app.use(expressWinston.errorLogger({
      transports: [
        new winston.transports.Console({
          timestamp: true,
          colorize: true
        })
      ]
    }));
  },

  access: function(app) {
    app.use(expressWinston.logger({
      transports: [
        new winston.transports.Console({
          timestamp: true,
          colorize: true
        })
      ]
    }));
  }
};

module.exports = logger;
