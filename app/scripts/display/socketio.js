define('socketio', (function(window, io, undefined) {
  'use strict';
  /* Socket.io related functions */

  var screen = require('screen'),
      localStorage = require('localstorage');

  function connect() {
    var socket = io.connect(window.location.origin + '/display');

    socket.on('connect', function() {
      console.info('[Dashkiosk] connected to socket.io server');

      // We register by providing a blob the server handed us to
      // remember us. If we get null, that's fine, the server will see
      // us as a new fresh screen.
      var blob = localStorage.getItem('register') || null;
      socket.emit('register', {
        blob: blob
      });
    });

    socket.on('disconnect', function() {
      console.warn('[Dashkiosk] connection to socket.io lost');
      screen.loading();
    });

    socket.on('register', function(blob) {
      console.info('[Dashkiosk] registered to server');
      localStorage.setItem('register', blob);
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

})(window, io));
