define('supervisor', (function(window) {
  'use strict';

  var lastTimeout = null,
      ready = function() {
        // Tell through a message
        console.debug('[Dashkiosk] Send heartbeat to supervisor');
        if (window.parent && window.parent.postMessage) {
          window.parent.postMessage('ready', '*');
        }
        // Tell through a JSInterface
        if (window.JSInterface && window.JSInterface.ready) {
          window.JSInterface.ready();
          if (window.JSInterface.timeout) {
            if (lastTimeout) {
              window.clearTimeout(lastTimeout);
            }
            lastTimeout = window.setTimeout(ready, window.JSInterface.timeout() * 0.8);
          }
        }
      };

  return {
    ready: ready
  };

})(window));
