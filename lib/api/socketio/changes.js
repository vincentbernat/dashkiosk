'use strict';

// Socket.io API module to publish changes. This is a read-only
// API. Clients are expected to connect to the appropriate channel
// with Socket.IO and will receive snapshot of the current state, as
// if they were using the REST API.

var _ = require('lodash'),
    Promise = require('bluebird'),
    logger = require('../../logger'),
    scs = require('../scs'),
    utils = require('../../utils'),
    models = require('../../models'),
    bus = require('../../bus');

var serial = 0;        // Incremented on each change.

// Send a complete snapshot
function snapshot() {
  var startSerial = serial;     // Change detection during the build process
  return models.Group.all()
    .then(function(groups) {
      // Retrieve all dashboards for each group
      var ddashboards = _.mapValues(groups, function(group) {
        return group.getDashboards();
      });
      // Retrieve all displays for each group
      var ddisplays = _.mapValues(groups, function(group) {
        return group.getDisplays();
      });
      return Promise.props(ddashboards)
        .then(function(dashboards) {
          return Promise.props(ddisplays)
            .then(function(displays) {
              return _.mapValues(groups, function(g, k) {
                var result = g.toJSON();
                result.displays = _.mapValues(displays[k], function(d) { return d.toJSON(); });
                result.dashboards = _.map(dashboards[k], function(d) { return d.toJSON(); });
                return result;
              });
            });
        });
    })
    .then(function(result) {
      if (serial !== startSerial) {
        logger.debug('change detected while creating a snapshot');
        return snapshot();
      }
      return result;
    });
}

// Handle a new client for the changes API
function handleNewClient(io) {
  io.on('connection', function(socket) {
    logger.info('new client for changes API', socket.handshake.address);
    snapshot(socket)
      .then(function(result) {
        // Send the snapshot
        socket.emit('snapshot', result);
        // Join the room with all changes
        socket.join('changes');
      })
      .catch(function(err) {
        logger.exception('unable to send initial snapshot', err, socket);
        socket.disconnect();
      });
  });
}

module.exports = function(io) {
  handleNewClient(io);
};
