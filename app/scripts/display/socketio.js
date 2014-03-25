define('socketio', (function(io) {
  'use strict';
  /* Socket.io related functions */

  var screen = require('screen');

  function connect() {
    var socket = io.connect(window.location.origin + '/display');

    socket.on('connect', function() {
      console.info('[Dashkiosk] connected to socket.io server');
    });

    socket.on('disconnect', function() {
      console.warn('[Dashkiosk] connection to socket.io lost');
      screen.loading();
    });

    socket.on('url', function(url) {
      console.info('[Dashkiosk] should display URL ', url);
      screen.url(url);
    });

    socket.on('reload', function() {
      console.info('[Dashkiosk] reload requested');
      window.location.reload();
    });
  }

  return {
    connect: connect
  };

})(io));
