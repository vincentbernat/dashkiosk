define('console', (function(window) {
  'use strict';

  if (window.JSInterface && window.JSInterface.log) {
    var log = function() {
      return function() {
        window.JSInterface.log.apply(window.JSInterface, arguments);
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
    console.log(window.console);
    return window.console;
  }
})(window));
