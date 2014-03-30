'use strict';

var postal = require('postal'),
    config = require('./config'),
    logger = require('./logger');

if (config.get('environment') === 'development') {
  var Tap = require('postal.diagnostics')(require('lodash'),
                                          postal),
      tap = new Tap({ name: 'winston',
                      serialize: function(envelope) { return envelope; },
                      writer: function(output) {
                        logger.debug('postal', output);
                      }
                    });
}

module.exports = postal.channel("dashkiosk");
