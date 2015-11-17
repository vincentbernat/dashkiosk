module.exports = (function(undefined) {
  'use strict';

  var IframeQueue = require('./iframe-queue'),
      queue = new IframeQueue({
    ready: function() {
      document.querySelector('#loading').classList.remove('show');
    }
  });

  /* Display connecting symbol */
  function connecting() {
    document.querySelector('.connecting').classList.add('show');
  }
  function connected() {
    document.querySelector('.connecting').classList.remove('show');
  }

  /* Display the given dashboard */
  function dashboard(d) {
    // Check URL validity
    if (typeof d.url !== 'string') {
      console.warn('[Dashkiosk] received an URL without target: ' + d.url);
      return;
    }
    // Push it
    queue.push(d);
  }

  return {
    connecting: connecting,
    connected: connected,
    dashboard: dashboard
  };

})();
