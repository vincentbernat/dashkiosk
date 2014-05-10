/**
 * Main module
 */

(function(window, $, undefined) {
  'use strict';

  var socketio = require('socketio'),
      errors = require('errors'),
      supervisor = require('supervisor'),
      console = require('console');

  window.console = console;
  errors.enable();

  $(window).on('load', function() {
    supervisor.ready();
    // OK, ready, connect to socket.io
    console.log('[Dashkiosk] dashkiosk ready, connect to socket.io server');
    socketio.connect();
  });

})(window, Zepto);
