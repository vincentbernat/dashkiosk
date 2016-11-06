/**
 * Main module
 */

(function(window, undefined) {
  'use strict';

  var socketio = require('./receiver/socketio'),
      errors = require('./receiver/errors'),
      supervisor = require('./receiver/supervisor'),
      console = require('./receiver/console'),
      document = window.document;

  window.console = console;
  errors.enable();

  document.addEventListener('DOMContentLoaded', function() {
    supervisor.ready();
    // OK, ready, connect to socket.io
    console.log('[Dashkiosk] dashkiosk ready, connect to socket.io server');
    socketio.connect();
  });

})(window);
