'use strict';

var http     = require('http'),
    socketio = require('socket.io'),
    path     = require('path'),
    fs       = require('fs'),
    util     = require('util'),
    glob     = require('glob'),
    _        = require('lodash'),
    logger   = require('./lib/logger'),
    config   = require('./lib/config'),
    chromecast = require('./lib/chromecast');

var app = require('./lib/express'),
    server = http.createServer(app),
    io = socketio.listen(server, {
      logger: logger
    });

// Static files
var serve = {
  wildcard: function(file) {
    var f = path.join(config.get('path:static'), file),
        matches = glob.sync(f);
    if (matches.length > 0) {
      return function(req, res) {
        res.sendfile(matches[0]);
      };
    } else {
      throw new Error('Provided wildcard does not match anything');
    }
  },
  regular: function(file) {
    var f = path.join(config.get('path:static'), file);
    return function(req, res) {
      res.sendfile(f);
    };
  },
  template: function(file) {
    // Currently, the templating is only done for branding purposes
    var f = path.join(config.get('path:static'), file);
    return function(req, res) {
      fs.readFile(f, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }
        var template = _.template(data)({
          branding: config.get('branding')
        });
        console.log('hello');
        res.send(template);
      });
    };
  }
};
app.get('/', function(req, res) { res.redirect('/receiver'); });
app.get('/favicon.ico', serve.wildcard('images/*favicon.ico'));
app.get('/admin',       serve.template('admin.html'));
app.get('/receiver',    serve.template('receiver.html'));
app.get('/unassigned',  serve.template('unassigned.html'));
app.get('/chromecast',  serve.regular('chromecast.html'));

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
    if (config.get('chromecast:enabled')) {
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
