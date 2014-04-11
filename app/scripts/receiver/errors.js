define('errors', (function(window) {
  'use strict';

  return {
    enable: function() {
      window.onerror = function(message, url, line, column, errorObj) {
        if (errorObj === undefined) {
          // We won't do anything more sensible than the default action
          return false;
        }
        console.error('[Dashkiosk] ' +
                     '(' + url + ':' + line + ':' + column + '): ' + message);
        console.error('[Dashkiosk] Stack:\n' + errorObj.stack);
        return true;
      };
    }
  };

})(window));
