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

function listenChanges(io) {
  // Display state: send either 'display.updated' or 'display.deleted'
  bus.subscribe('display.*.connected', function(data) {
    io.in('changes').emit('display.updated', data.display.toJSON());
  });
  bus.subscribe('display.*.disconnected', function(data) {
    io.in('changes').emit('display.updated', data.display.toJSON());
  });
  bus.subscribe('display.*.group', function(data) {
    io.in('changes').emit('display.updated', data.display.toJSON());
  });
  bus.subscribe('display.*.updated', function(data) {
    io.in('changes').emit('display.updated', data.display.toJSON());
  });
  bus.subscribe('display.*.deleted', function(data) {
    io.in('changes').emit('display.deleted', data.display.toJSON());
  });

  // Queue a group update
  var queue = (function() {
    var p = new Promise(function(r) { return r(); });         // We don't want group update to be mixed

    return function(event, group) {
      if (event === 'deleted') {
        // We don't cannot give a full view since the group doesn't exist anymore.
        p.then(function() {
          io.in('changes').emit('group.deleted', { id: group.toJSON().id });
        });
        return;
      }

      // Grab what we need
      p.then(function() {
        return Promise.all([group.getDashboards(), group.getDisplays()])
          .spread(function(dashboards, displays) {
            var r = group.toJSON();
            r.displays = _.mapValues(displays, function(d) { return d.toJSON(); });
            r.dashboards = _.map(dashboards, function(d) { return d.toJSON(); });
            io.in('changes').emit('group.' + event, r);
          });
      })
      .catch(function(err) {
        logger.exception('unable to build group snapshot', err);
        _.each(io.clients('changes'), function(socket) { socket.disconnect(); });
      });
    };
  })();

  // Group state: send 'group.created', 'group.updated' or 'group.deleted'
  bus.subscribe('group.*.created', function(data) {
    queue('created', data.group);
  });
  bus.subscribe('group.*.updated', function(data) {
    queue('updated', data.group);
  });
  bus.subscribe('group.*.deleted', function(data) {
    queue('deleted', data.group);
  });
  bus.subscribe('group.*.dashboard.*.added', function(data) {
    queue('updated', data.group);
  });
  bus.subscribe('group.*.dashboard.*.removed', function(data) {
    queue('updated', data.group);
  });
  bus.subscribe('group.*.dashboard.*.updated', function(data) {
    queue('updated', data.group);
  });

}

module.exports = function(io) {
  listenChanges(io);
  handleNewClient(io);
};
