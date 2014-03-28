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
      var client;
      try {
        client = JSON.parse(scs.decode(data.blob));
      } catch (e) {
        client = {};
      }

      // On success, reply with the blob to store
      var success = function(display) {
        var encrypted = scs.encode(JSON.stringify({
          name: display.name
        }));
        fn(encrypted);
        winston.info('registered new display', display.name);
        socket.join(display.getGroup().name);
      };

      // Create a new client in the DB and associate it to the unassigned group
      var create = function() {
        models.Display.create({ name: utils.randomString(6) })
          .then(function(display) {
            return models.Group.findOrCreate({ name: 'unassigned' }, {})
              .spread(function(unassigned, created) {
                if (created) {
                  // We need to create the unassigned group and give
                  // it the appropriate dashboard
                  return models.Dashboard.create({ url: '/unassigned' })
                    .then(function(dashboard) {
                      return unassigned.setDashboards([dashboard]);
                    })
                    .then(function(unassigneds) {
                      return unassigneds[0];
                    });
                }
                return unassigned;
              })
              .then(function(unassigned) {
                return display.setGroup(unassigned);
              }).then(function() { return display; });
          })
          .then(function(display) {
            success(display);
          })
          .catch(function(err) {
            winston.warn('unable to associate new display to unassigned group',
                         err);
            socket.disconnect();
          });
      };

      if(typeof client.name === 'string' &&
         client.name.length !== 0) {
        // Find the display
        models.Display.find({ where: { name: client.name },
                              include: [ models.Group ]})
          .then(function(display) {
            if (display) {
              success(display);
            } else {
              create();
            }
          })
          .catch(function(err) {
            winston.warn('unable to check if client is registered',
                         err);
            socket.disconnect();
          });
      } else {
        // We need to create one
        create();
      }
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
