'use strict';

var express  = require('express'),
    logger   = require('./logger'),
    config   = require('./config');

var app = module.exports = express();

// Configuration of Express.js
app.configure('development', function() {
  app.use(require('connect-livereload')({
    port: process.env.LIVERELOAD_PORT
  }));
});
app.configure(function() {
  app.use(express.static(config.path.static));
  app.use(express.methodOverride());

  logger.express.access(app);
  app.use(app.router);
  logger.express.error(app);
});
app.configure('development', function() {
  app.use(express.errorHandler());
});
