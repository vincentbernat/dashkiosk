'use strict';

// Socket.io API module for displays.

var logger = require('../../logger'),
    scs = require('../scs'),
    utils = require('../../utils'),
    models = require('../../models');

module.exports = function(io) {

  io.on('connection', function(socket) {
    logger.info('new client', socket.handshake.address);
    socket.on('register', function(data, fn) {

      // Handle registration, retrieve the client name or generate a new one.
      var name;
      try {
        name = JSON.parse(scs.decode(data.blob)).name;
      } catch (e) {
        name = null;
      }

      // Find the display
      models.Display.register(name)
        .then(function(display) {
          var name = display.toJSON().name;
          var encrypted = scs.encode(JSON.stringify({
            name: name
          }));
          fn(encrypted);
          logger.info('registered new display', name);
        })
        .catch(function(err) {
          logger.exception('unable to register new client', err);
          socket.disconnect();
        });
    });
  });
};
