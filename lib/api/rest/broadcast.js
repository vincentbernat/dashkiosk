'use strict';

var models = require('../../models'),
    _  = require('lodash'),
    logger = require('../../logger.js'),
    bus = require('../../bus.js');

module.exports = function(app) {

  // put a 'broadcast' - temporary dashboard - on all groups
  app.post('/broadcast', function(req, res, next) {
    var options = req.body;
    if (!options.url) {
      res.send(400, { message: 'Must specify a url' });
      return;
    }
    bus.publish('broadcast', {
      url: options.url,
      timeout: options.timeout
    });
    res.send(200);
  });
};
