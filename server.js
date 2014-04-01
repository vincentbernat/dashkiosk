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
app.get('/', function(req, res) { res.redirect('/receiver'); });
app.get('/favicon.ico', serve('images/favicon.ico'));
app.get('/admin', serve('admin.html'));
app.get('/receiver', serve('receiver.html'));
app.get('/unassigned', serve('unassigned.html'));

// API
var api = require('./lib/api');
api.socketio(io);
api.rest(app);

// DB
var db = require('./lib/db'),
    models = require('./lib/models');
db
  .sequelize
  .sync()
  .then(function() { return models.Group.run(); })
  .catch(function(err) {
    if (err instanceof Array) {
      throw err[0];
    }
    throw err;
  })
  .then(function() {
    server.listen(config.get('port'), function() {
      logger.info('Express server listening on port %d in %s mode',
                  config.get('port'),
                  config.get('environment'));
    });
  });

module.exports = app;
