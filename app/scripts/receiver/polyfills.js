// Simple polyfill for performance.now()
module.exports = function() {
  'use strict';

  (function() {

    var perf = window.performance = window.performance || {};
    window.performance.now = perf.now ||
      perf.mozNow ||
      perf.msNow ||
      perf.oNow ||
      perf.webkitNow ||
      Date.now || function() {
        return new Date().getTime();
      };
  })();

  // Simple polyfill for window.requestAnimationFrame
  (function() {

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

  })();
};
