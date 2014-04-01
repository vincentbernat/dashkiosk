define('socketio', (function(window, io, undefined) {
  'use strict';
  /* Socket.io related functions */

  var screen = require('screen'),
      osd = require('osd'),
      localStorage = require('localstorage');

  function connect() {
    var socket = io.connect(window.location.origin + '/displays');

    socket.on('connect', function() {
      console.info('[Dashkiosk] connected to socket.io server');

      // We register by providing a blob the server handed us to
      // remember us. If we get null, that's fine, the server will see
      // us as a new fresh screen.
      var blob = localStorage.getItem('register') || null;
      socket.emit('register', {
        blob: blob
      }, function(data) {
        console.info('[Dashkiosk] registered to server');
        localStorage.setItem('register', data);
      });
    });

    socket.on('disconnect', function() {
      console.warn('[Dashkiosk] connection to socket.io lost');
      screen.loading();
    });

    socket.on('dashboard', function(dashboard) {
      console.info('[Dashkiosk] should display dashboard ' + dashboard.url);
      screen.dashboard(dashboard);
    });

    socket.on('reload', function() {
      console.info('[Dashkiosk] reload requested');
      window.location.reload();
    });

    socket.on('osd', function(text) {
      if (text === undefined || text === null) {
        console.info('[Dashkiosk] hide OSD');
        osd.hide();
      } else {
        console.info('[Dashkiosk] display OSD');
        osd.show(text);
      }
    });
  }

  return {
    connect: connect
  };

})(window, io));
