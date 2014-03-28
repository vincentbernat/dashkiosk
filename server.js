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
  // handleExceptions: true,
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
    res.sendfile(path.join(config.path.static, file));
  };
}
app.get('/', function(req, res) { res.redirect('/display'); });
app.get('/admin', serve('admin.html'));
app.get('/display', serve('display.html'));
app.get('/unassigned', serve('unassigned.html'));

// API and DB
var api = require('./lib/api'),
    db = require('./lib/models');

api
  .display(io.of('/display'));
db
  .sequelize
  .sync()
  .complete(function(err) {
    if (!!err) {
      throw err;
    } else {
      server.listen(config.port, function() {
        winston.info('Express server listening on port %d in %s mode',
                     config.port, config.env);
      });
    }
  });

module.exports = app;
