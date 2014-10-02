'use strict';

try {
  var memwatch = require('memwatch');
} catch (er) {
  memwatch = null;
}

var logger = require('./logger');

var interval = 10 * 60 * 1000;  // Interval between leak reports

function start() {
  if (memwatch === null) {
    logger.warn('Memory leak detector disabled. `memwatch\' module not installed');
    return;
  }
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
