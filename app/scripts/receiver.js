/**
 * Main module
 */

(function(window, $, undefined) {
  'use strict';

  var socketio = require('socketio'),
      errors = require('errors');

  errors.enable();

  $(window).on('load', function() {
    // Tell through a message
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage('ready', '*');
    }
    // Tell through a JSInterface
    if (window.JSInterface && window.JSInterface.ready) {
      window.JSInterface.ready();
    }
    // OK, ready, connect to socket.io
    console.log('[Dashkiosk] dashkiosk ready, connect to socket.io server');
    socketio.connect();
  });

})(window, Zepto);
