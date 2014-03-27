'use strict';

var express  = require('express'),
    winston  = require('winston'),
    expressWinston = require('express-winston'),
    config = require('./config');

var app = module.exports = express();

// Configuration of Express.js
app.configure('development', function() {
  app.use(require('connect-livereload')({
    port: process.env.LIVERELOAD_PORT
  }));
});
app.configure(function() {
  app.use(express.static(config.static));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());

  app.use(expressWinston.logger({
    transports: [
      new winston.transports.Console({
        timestamp: true,
        colorize: true
      })
    ]
  }));
  app.use(app.router);
  app.use(expressWinston.errorLogger({
    transports: [
      new winston.transports.Console({
        timestamp: true,
        colorize: true
      })
    ]
  }));
});
app.configure('development', function() {
  app.use(express.errorHandler());
});
