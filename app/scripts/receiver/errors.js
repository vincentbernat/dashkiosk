define('errors', (function(window) {
  'use strict';

  return {
    enable: function() {
      window.onerror = function(message, url, line, column, errorObj) {
        try {
          if (errorObj === undefined || errorObj === null) {
            // We won't do anything more sensible than the default action
            return false;
          }
          console.error('[Dashkiosk] ' +
                        '(' + url + ':' + line + ':' + column + '): ' + message);
          console.error('[Dashkiosk] Stack:\n' + errorObj.stack);
          return true;
        } finally {
          console.error('[Dashkiosk] Fatal unexpected error, let\'s reload');
          setTimeout(function() {
            window.location.reload();
          }, 1000);
        }
      };
    }
  };

})(window));
