'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    express = require('express'),
    bodyParser = require('body-parser'),
    logger = require('../../logger'),
    utils = require('../../utils');

module.exports = function(app) {

  var rest = express();
  app.use('/api', rest);

  rest.use(bodyParser.json());
  rest.use(bodyParser.urlencoded({ extended: true }));

  function isNumeric(what) {
    return function(req, res, next, n) {
      if (!isNaN(parseFloat(n)) && isFinite(n)) {
        req.params[what] = parseInt(n, 10);
        next();
      } else {
        next(new Error('non-numeric value for ' + what));
      }
    };
  }
  rest.param('id', isNumeric('id'));
  rest.param('group_id', isNumeric('group_id'));
  rest.param('display_id', isNumeric('display_id'));
  rest.param('dashboard_id', isNumeric('dashboard_id'));

  fs
    .readdirSync(__dirname)
    .filter(function(file) {
      return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function(file) {
      require('./' + file)(rest);
    });

  // Handling errors
  rest.use(function(err, req, res, next) {
    if (!err) return next();

    var token = Date.now() + '-' + utils.randomString(10);
    var answer = {
      message: err.message || 'Error while processing request.',
      token: token
    };
    if (app.get('env') === 'development') {
      answer.error = _.extend({
        stack: err.stack && err.stack.split('\n')
      }, err);
    }
    res.status(err.httpCode || 500).json(answer);

    logger.exception('while handling API request', err,
                     { token: token,
                       method: req.method,
                       url: req.url });
    return undefined;
  });

};
