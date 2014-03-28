'use strict';

var http     = require('http'),
    socketio = require('socket.io'),
    path     = require('path'),
    util     = require('util'),
    logger   = require('./lib/logger'),
    config   = require('./lib/config');

process.env.NODE_ENV = process.env.NODE_ENV || config.env;

var app = require('./lib/express'),
    server = http.createServer(app),
    io = socketio.listen(server, {
      logger: logger
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

// API
var api = require('./lib/api');
api.socketio(io);
api.rest(app);

// DB
var db = require('./lib/db');
db
  .sequelize
  .sync()
  .complete(function(err) {
    if (!!err) {
      throw err;
    } else {
      server.listen(config.port, function() {
        logger.info('Express server listening on port %d in %s mode',
                     config.port, config.env);
      });
    }
  });

module.exports = app;
