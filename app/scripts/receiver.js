/**
 * Main module
 */

(function(window, $, undefined) {
  'use strict';

  var socketio = require('socketio'),
      errors = require('errors'),
      supervisor = require('supervisor'),
      console = require('console'),
      benchmark = require('benchmark');

  window.console = console;
  errors.enable();

  $(window).on('load', function() {
    benchmark.done(function() {
      $('.show').addClass('loading');
      supervisor.ready();
      // OK, ready, connect to socket.io
      console.log('[Dashkiosk] dashkiosk ready, connect to socket.io server');
      socketio.connect();
    });
  });

})(window, Zepto);
