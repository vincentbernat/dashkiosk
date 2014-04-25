'use strict';

var memwatch = require('memwatch'),
    logger = require('./logger');

var interval = 10 * 60 * 1000;  // Interval between leak reports

function start() {
  memwatch.once('leak', function(info) {
    logger.warn('Leak detected. Starting heap diff.', info);

    var hd = new memwatch.HeapDiff();
    memwatch.once('stats', function(stats) {
      var diff = hd.end();
      logger.warn('Memory leak detected.', {
        stats: stats,
        diff: diff
      });
      setTimeout(start, interval);
    });
  });
}

module.exports = {
  start: start
};
