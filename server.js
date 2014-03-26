'use strict';

var express  = require('express'),
    http     = require('http'),
    socketio = require('socket.io'),
    winston  = require('winston'),
    expressWinston = require('express-winston'),
    path     = require('path'),
    util     = require('util'),
    config   = require('./lib/config');

process.env.NODE_ENV = process.env.NODE_ENV || config.env;

// Configure logging
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  colorize: true,
  timestamp: true,
  level: config.logLevel
});

var app = express(),
    server = http.createServer(app),
    io = socketio.listen(server, {
      logger: {
        debug: winston.debug,
        info: winston.info,
        error: winston.error,
        warn: winston.warn
      }
    });

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

// HTML applications
function serve(file) {
  return function(req, res) {
    res.sendfile(path.join(config.static, file));
  };
}
app.get('/', function(req, res) { res.redirect('/display'); });
app.get('/admin', serve('admin.html'));
app.get('/display', serve('display.html'));
app.get('/unassigned', serve('unassigned.html'));

// API
require('./lib/api/display')(io.of('/display'));

server.listen(config.port, function() {
  winston.info('Express server listening on port %d in %s mode',
              config.port, config.env);
});

exports = module.exports = app;
