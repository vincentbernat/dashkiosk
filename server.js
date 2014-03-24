'use strict';

var restify  = require('restify'),
    socketio = require('socket.io'),
    bunyan   = require('bunyan'),
    path     = require('path'),
    config   = require('./lib/config');

var log = new bunyan({
  name: 'dashkiosk',
  streams: [
    {
      stream: process.stdout,
      level: 'info'
    }
  ],
  serializers: restify.bunyan.serializers
});

var options = {
  name: 'Dashkiosk API',
  version: '1.0.0',
  log: log
};

var app = restify.createServer(options),
    io  = socketio.listen(app, {
      logger: {
        debug: function(w) { log.debug({source: 'socket.io'}, w); },
        info:  function(w) { log.info({source: 'socket.io'}, w); },
        error: function(w) { log.error({source: 'socket.io'}, w); },
        warn:  function(w) { log.warn({source: 'socket.io'}, w); },
        trace: function(w) { log.trace({source: 'socket.io'}, w); }
      }
    });

app.use(restify.acceptParser(app.acceptable));
app.use(restify.throttle({
  burst: 30,
  rate: 5,
  ip: true
}));

// Logging
app.on('after', function(req, res, route) {
  req.log.info({req: req, res: res}, 'access');
});
app.on('uncaughtException', function(req, res, route, err) {
  req.log.warn({req: req, res: res, err: err}, 'error');
  res.send(err);
});

// Default URL
function redirect(to) {
  return function(req, res, next) {
    res.header('Location', to);
    res.send(302);
    return next(false);
  };
}
app.get('/', redirect('/display.html'));
app.get('/admin', redirect('/admin.html'));
app.get('/display', redirect('/display.html'));

/*
// See: https://github.com/mcavage/node-restify/issues/565
if (config.env === 'development') {
  app.get(/\/\w+\.html/, require('connect-livereload')({
    port: process.env.LIVERELOAD_PORT
  }));
}
*/

// Static files
var staticHandler = restify.serveStatic({
    directory: config.static
});
app.get(/\/(bower_components|images|scripts|styles)\/.*/, staticHandler);
app.get(/\/\w+\.html/, staticHandler);

// Websocket for displays
io
  .of('/display')
  .on('connection', function(socket) {
    log.info(socket.handshake.address, 'new client');
    socket.join('displays');
  });

// Use a fixed list of URL for now
setInterval((function() {
  var urls = [ 'http://dashingdemo.herokuapp.com/sampletv',
               'http://socket.io/',
               'http://fr.wikipedia.org/' ];
  return function() {
    log.info({ url: urls[0] }, 'sending new URL to everyone');
    io.of('/display').in('displays').emit('url', { target: urls[0] });
    urls.push(urls.shift());
  };
})(), 10000);

app.listen(config.port, function() {
  log.info('RESTify server listening on port %d in %s mode',
              config.port, config.env);
});

exports = module.exports = app;
