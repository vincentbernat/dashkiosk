'use strict';

var http     = require('http'),
    socketio = require('socket.io'),
    path     = require('path'),
    util     = require('util'),
    logger   = require('./lib/logger'),
    config   = require('./lib/config'),
    chromecast = require('./lib/chromecast');

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
app.get('/chromecast', serve('chromecast.html'));

// API
var api = require('./lib/api');
api.socketio(io);
api.rest(app);

// DB
var db = require('./lib/db'),
    models = require('./lib/models');
db
  .sequelize
  .getMigrator({
    path: path.join(config.get('path:root'), 'db', 'migrations'),
    filesFilter: /^\d.*\.js$/
  })
  .migrate()
  .then(function() { return models.Group.run(); })
  .catch(function(err) {
    if (err instanceof Array) {
      throw err[0];
    }
    throw err;
  })
  .then(function() {
    if (config.get('chromecast')) {
      chromecast();
    }
    server.listen(config.get('port'), function() {
      logger.info('Express server listening on port %d in %s mode',
                  config.get('port'),
                  config.get('environment'));
    });
  })
  .catch(function(err) {
    logger.exception('fatal error', err);
    process.exit(1);
  });

module.exports = app;
