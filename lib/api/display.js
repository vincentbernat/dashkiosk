'use strict';

// API module for displays. This is a websocket only API.

var winston = require('winston'),
    scs = require('../scs'),
    utils = require('../utils'),
    models = require('../models');

module.exports = function displayApi(io) {

  io.on('connection', function(socket) {
    winston.info('new client', socket.handshake.address);
    socket.on('register', function(data, fn) {

      // Handle registration, retrieve the client name or generate a new one.
      var name;
      try {
        name = JSON.parse(scs.decode(data.blob)).name;
      } catch (e) {
        name = null;
      }

      // On success, reply with the blob to store
      var success = function(display) {
      };

      // Find the display
      models.Display.find({ where: { name: name },
                            include: [ models.Group ]})
        .then(function(display) {
          if (display) {
            return display;
          } else {
            return models.Display.create({ name: utils.randomString(6) })
              .then(function(display) {
                return models.Group.unassigned()
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
          winston.info('registered new display', display.name);
          socket.join(display.getGroup().name);
        })
        .catch(function(err) {
          winston.warn('unable to register new client',
                       err);
          socket.disconnect();
        });
    });
  });

  // Use a fixed list of URL for now
  setInterval((function() {
    var urls = [ '/unassigned',
                 'http://socket.io/',
                 'http://fr.wikipedia.org/' ];
    return function() {
      winston.info('sending new URL to everyone', { url: urls[0] });
      io.in('displays').emit('url', { target: urls[0] });
      urls.push(urls.shift());
    };
  })(), 10000);

};
