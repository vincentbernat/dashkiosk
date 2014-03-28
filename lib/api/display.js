'use strict';

// API module for displays. This is a websocket only API.

var logger = require('../logger'),
    scs = require('../scs'),
    utils = require('../utils'),
    db = require('../db');

module.exports = function displayApi(io) {

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
      db.Display.find({ where: { name: name },
                        include: [ db.Group ]})
        .then(function(display) {
          if (display) {
            return display;
          } else {
            return db.Display.create({ name: utils.randomString(6) })
              .then(function(display) {
                return db.Group.unassigned()
                  .then(function(unassigned) {
                    return display.setGroup(unassigned);
                  })
                  .then(function() { return display; });
              });
          }
        })
        .then(function(display) {
          var encrypted = scs.encode(JSON.stringify({
            name: display.name
          }));
          fn(encrypted);
          logger.info('registered new display', display.name);
          socket.join(display.getGroup().name);
        })
        .catch(function(err) {
          logger.exception('unable to register new client', err);
          socket.disconnect();
        });
    });
  });

  return module.exports;
};
