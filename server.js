'use strict';

var http     = require('http'),
    socketio = require('socket.io'),
    path     = require('path'),
    util     = require('util'),
    logger   = require('./lib/logger'),
    config   = require('./lib/config');

var app = require('./lib/express'),
    server = http.createServer(app),
    io = socketio.listen(server, {
      logger: logger
    });

// Static files
function serve(file) {
  return function(req, res) {
    res.sendfile(path.join(config.get('path:static'), file));
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
      // Throw only the first one
      throw err[0];
    } else {
      server.listen(config.get('port'), function() {
        logger.info('Express server listening on port %d in %s mode',
                    config.get('port'),
                    config.get('environment'));
      });
    }
  });

module.exports = app;
