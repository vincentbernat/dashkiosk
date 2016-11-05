module.exports = (function(window) {
  'use strict';

  if (window.JSInterface && window.JSInterface.log) {
    var log = function(level) {
      return function(message) {
        window.JSInterface.log(level + ': ' + message);
      };
    };
    return {
      log: log('log'),
      info: log('info'),
      warn: log('warn'),
      error: log('error'),
      debug: log('debug')
    };
  } else {
    return window.console;
  }
})(window);
