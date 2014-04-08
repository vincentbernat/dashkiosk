'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    express = require('express'),
    params = require('express-params'),
    logger = require('../../logger'),
    utils = require('../../utils');

module.exports = function(app) {

  var rest = express();
  app.use('/api', rest);

  rest.use(express.json());
  rest.use(express.urlencoded());

  params.extend(rest);
  rest.param('id', Number);
  rest.param('group_id', Number);
  rest.param('display_id', Number);
  rest.param('dashboard_id', Number);

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
    res.json(err.httpCode || 500, answer);

    logger.exception('while handling API request', err,
                     { token: token,
                       method: req.method,
                       url: req.url });
    return undefined;
  });

};
