'use strict';

var http     = require('http'),
    socketio = require('socket.io'),
    winston  = require('winston'),
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

var app = require('./lib/express'),
    server = http.createServer(app),
    io = socketio.listen(server, {
      logger: {
        debug: winston.debug,
        info: winston.info,
        error: winston.error,
        warn: winston.warn
      }
    });

// Static files
function serve(file) {
  return function(req, res) {
    res.sendfile(path.join(config.static, file));
  };
}
app.get('/', function(req, res) { res.redirect('/display'); });
app.get('/admin', serve('admin.html'));
app.get('/display', serve('display.html'));
app.get('/unassigned', serve('unassigned.html'));

// Database
var models = require('./lib/models');

// API
require('./lib/api/display')(io.of('/display'));

server.listen(config.port, function() {
  winston.info('Express server listening on port %d in %s mode',
              config.port, config.env);
});

exports = module.exports = app;
