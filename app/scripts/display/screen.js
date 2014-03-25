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

  /* Display the given URL */
  function url(u) {
    // Check URL validity
    if (typeof u.target !== 'string') {
      console.warn('[Dashkiosk] received an URL without target: ', u);
      return;
    }
    // Push it
    queue.push({
      target: u.target
    });
  }

  return {
    loading: loading,
    url: url
  };

})(Zepto));

