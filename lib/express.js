'use strict';

var express  = require('express'),
    expressStatic = require('serve-static'),
    expressMustache = require('mustache-express'),
    expressErrorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    auth = require('http-auth'),
    fs = require('fs'),
    path = require('path'),
    logger   = require('./logger'),
    config   = require('./config'),
    version  = require('../package.json').version;

var app = module.exports = express();

// Configuration of Express.js
if (app.get('env') === 'development') {
  app.use(require('connect-livereload')({
    port: process.env.LIVERELOAD_PORT
  }));
}



if (config.get('forcessl')) {
  var forceSsl = function(req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
  return next();
  };
  app.use(forceSsl);
}

// Logging
logger.express.access(app);
logger.express.error(app);

// Authentication
if (config.get('auth:enabled')) {
  var basic = auth.basic({
    realm: config.get('auth:realm')
  }, function(username, password, callback) {
    // Custom authentication method.
    callback(username === config.get('auth:username') &&
             password === config.get('auth:password'));
  });
  app.use(auth.connect(basic));
}

// Asset handling
var assets = {};
try {
  assets = require('../assets.json');
} catch (e) {}


// Configure Mustache for templating
var mustacheLocals = {
  branding: config.get('branding'),
  version: version,
  unassigned: fs.readdirSync(path.join(config.get('path:static'), 'images', 'unassigned')),
  grade: 'medium',
  asset: function() {
    return function(f, render) {
      f = render(f);
      return assets[f] || f;
    };
  }
},
    mustacheUrls = ['admin', 'chromecast', 'receiver', 'unassigned'];
app.engine('html', expressMustache());
app.set('view engine', 'html');
app.set('views', config.get('path:static'));
mustacheUrls.forEach(function(url) {
  app.get('/' + url, function(req, res) {
    if (req.url.substr(-1) === '/') {
      res.redirect('/' + url);
      return;
    }
    res.render(url, mustacheLocals);
  });
});
app.get('/receiver-:grade', function(req, res) {
  var grades = [ 'slow', 'medium', 'fast' ];
  if (grades.indexOf(req.params.grade) > -1) {
    res.render('receiver',
               Object.assign({}, mustacheLocals, { grade: req.params.grade }));
  } else {
    res.redirect('/receiver');
  }
});

// Some special files
[ 'favicon.ico', 'favicon.png' ].forEach(function(f) {
  app.get('/' + f, function(req, res) {
    res.sendfile(assets['images/' + f] || 'images/' + f,
                 {root: config.get('path:static')});
  });
});

// Other files are static
app.use(expressStatic(config.get('path:static'), { extensions: ['html'] }));
app.use(methodOverride());

if (app.get('env') === 'development') {
  app.set('view cache', false);
  app.use(expressErrorHandler());
}
