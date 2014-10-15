'use strict';

var express  = require('express'),
    methodOverride = require('method-override'),
    logger   = require('./logger'),
    config   = require('./config');

var app = module.exports = express();

// Configuration of Express.js
if (app.get('env') === 'development') {
  app.use(require('connect-livereload')({
    port: process.env.LIVERELOAD_PORT
  }));
}

app.use(express.static(config.get('path:static')));
app.use(methodOverride());
logger.express.access(app);
app.use(app.router);
logger.express.error(app);

if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}
