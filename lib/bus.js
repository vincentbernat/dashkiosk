'use strict';

var postal = require('postal'),
    _ = require('lodash'),
    config = require('./config'),
    logger = require('./logger');

if (config.get('environment') === 'development') {
  var diagnostics = require('postal.diagnostics'),
      Tap = (diagnostics.length === 1)?
        diagnostics(postal):
        diagnostics(_, postal),
      tap = new Tap({ name: 'winston',
                      serialize: function(envelope) {
                        var serialized = _.pick(envelope,
                                                [ 'channel', 'topic', 'timeStamp' ]);
                        serialized.data = _.mapValues(envelope.data || {}, function(val) {
                          if (typeof val === 'object') {
                            return '...';
                          }
                          return val;
                        });
                        return serialized;
                      },
                      writer: function(output) {
                        logger.debug('postal', output);
                      }
                    });
}

module.exports = postal.channel("dashkiosk");
