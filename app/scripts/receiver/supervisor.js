define('supervisor', (function(window) {
  'use strict';

  // Extract timeout from location hash
  function timeoutFromLocationHash() {
    var timeouts = window.location.hash.slice(1).split(/[,#]/)
          .map(function(item) {
            var mo = /^timeout=(\d+)$/.exec(item);
            if (!mo) {
              return null;
            }
            return parseInt(mo[1]);
          })
          .filter(function(item) { return item !== null; });
    if (timeouts.length === 0) {
      return undefined;
    }
    return timeouts[0];
  }

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
        }
        // Heartbeat
        var timeout;
        if (window.JSInterface && window.JSInterface.timeout) {
          timeout = window.JSInterface.timeout();
        }
        timeout = timeout || timeoutFromLocationHash();
        if (lastTimeout) {
          window.clearTimeout(lastTimeout);
        }
        if (timeout) {
          lastTimeout = window.setTimeout(ready, timeout * 0.8);
        }
      };

  return {
    ready: ready
  };

})(window));
