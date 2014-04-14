'use strict';

// Socket.io API module for displays.

var _ = require('lodash'),
    logger = require('../../logger'),
    scs = require('../scs'),
    utils = require('../../utils'),
    models = require('../../models'),
    bus = require('../../bus');

// Handle newly arrived clients
function handleNewDisplay(io) {
  io.on('connection', function(socket) {
    logger.info('new display', socket.handshake.address);
    socket.on('register', function(data, fn) {

      // Handle registration, retrieve the display name or generate a new one.
      var name;
      try {
        name = JSON.parse(scs.decode(data.blob)).name;
      } catch (e) {
        name = null;
      }

      // Find the display
      models.Display.register(name)
        .then(function(display) {
          var name = display.toJSON().name,
              encrypted = scs.encode(JSON.stringify({
                name: name
              }));
          fn(encrypted);
          return display;
        })
        .then(function(display) {
          var name = display.toJSON().name,
              group = display.toJSON().group,
              viewport = display.toJSON().viewport,
              ip = (socket.handshake.headers || {})['x-forwarded-for'] ||
                (socket.handshake.address || {}).address;

          logger.info('registered display', name, ip);
          display
            .update({ip: ip})
            .catch(function(err) {
              logger.exception('unable to log client IP', err);
            });
          socket.emit('viewport', viewport || null);

          // Cleanup on disconnect
          var subscriptions = [];
          socket.on('disconnect', function() {
            logger.info('display disconnected', name);
            display.refresh().then(function(display) {
              display.disconnect();
            });
            _.each(subscriptions, function(s) {
              s.unsubscribe();
            });
          });

          // Join the appropriate rooms
          socket.join('group.' + group);

          // Listen to appropriate events
          _.extend(subscriptions, [
            bus.subscribe('display.' + name + '.dashboard', function(data) {
              var dashboard = data.dashboard.toJSON();
              logger.info('specific dashboard for display',
                          { client: name,
                            dashboard: dashboard });
              socket.emit('dashboard', dashboard);
            }),
            bus.subscribe('display.' + name + '.reload', function(data) {
              logger.info('requested reload for display', name);
              socket.emit('reload');
            }),
            bus.subscribe('display.' + name + '.osd', function(data) {
              logger.info('requested OSD display', data.text);
              socket.emit('osd', data.text);
            }),
            bus.subscribe('display.' + name + '.viewport', function(data) {
              var viewport = data.display.toJSON().viewport;
              logger.info('requested change of viewport', viewport);
              socket.emit('viewport', viewport || null);
            }),
            bus.subscribe('display.' + name + '.group', function(data) {
              var newgroup = data.group.toJSON();
              logger.info('change display to new group', {
                display: name,
                group: newgroup
              });
              socket.leave('group.' + group);
              socket.join('group.' + newgroup.id);
              group = newgroup.id;
            })
          ]);

          // Register the display as connected
          display.connect();
        })
        .catch(function(err) {
          logger.exception('unable to register new display', err);
          socket.disconnect();
        });
    });
  });
}

// Handle what should happen when a group requests a new dashboard
function handleGroupDashboard(io) {
  bus.subscribe('group.*.dashboard', function(data) {
    var group = data.group.toJSON(),
        dashboard = data.dashboard.toJSON();
    logger.info('new dashboard to display', {
      group: group,
      dashboard: dashboard
    });
    io.in('group.' + group.id).emit('dashboard', dashboard);
  });
}

module.exports = function(io) {
  handleNewDisplay(io);
  handleGroupDashboard(io);
};
