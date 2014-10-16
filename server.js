'use strict';

var http     = require('http'),
    socketio = require('socket.io'),
    path     = require('path'),
    util     = require('util'),
    glob     = require('glob'),
    logger   = require('./lib/logger'),
    config   = require('./lib/config'),
    chromecast = require('./lib/chromecast'),
    monitor    = require('./lib/monitor');

var app = require('./lib/express'),
    server = http.createServer(app),
    io = socketio.listen(server, {
      logger: logger
    });

// Static files
function serve(file) {
  var f = path.join(config.get('path:static'), file),
      matches = glob.sync(f);
  if (matches.length > 0) {
    return function(req, res) {
      res.sendfile(matches[0]);
    };
  }
  return function(req, res) {
    res.send(404, "Not found.");
  };
}
app.get('/', function(req, res) { res.redirect('/receiver'); });
app.get('/favicon.ico', serve('images/*favicon.ico'));
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
  .initialize()
  .then(function() { return models.Group.run(); })
  .catch(function(err) {
    if (err instanceof Array) {
      throw err[0];
    }
    throw err;
  })
  .then(function() {
    if (config.get('chromecast:enabled')) {
      chromecast();
    }
    monitor.start();
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

// Demo: halt after the given number of minutes
if (config.get('demo')) {
  var end = ((config.get('demo') * 1) || 60);
  logger.info('Demo mode enabled, will stop in ' + end + ' minutes');
  setTimeout(function() {
    logger.info('End of demo mode, quitting');
    process.exit(5);
  }, end * 60 * 1000);
}

module.exports = app;
