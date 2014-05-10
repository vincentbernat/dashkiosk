define('screen', (function($, undefined) {
  'use strict';

  var IframeQueue = require('iframe-queue'),
      queue = new IframeQueue({
    ready: function() {
      $('#loading').removeClass('show');
    }
  });

  /* Display loading screen */
  function loading() {
    queue.flush();
    $('#loading').addClass('show');
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
    loading: loading,
    dashboard: dashboard
  };

})(Zepto));

