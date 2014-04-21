'use strict';

var nodecastor = require('nodecastor'),
    _ = require('lodash'),
    logger   = require('./logger'),
    config   = require('./config'),
    models   = require('./models'),
    bus      = require('./bus'),
    scs      = require('./api/scs');

var homeId = '00000000-0000-0000-0000-000000000000',
    dashkioskId = '5E7A2C2C',
    dashkioskNs = 'urn:x-cast:com.deezer.cast.dashkiosk';

// Do something when we detect a status change from a chromecast device
function update(device, status) {
  // Is the device in the home screen?
  if (_.find(status.applications, { appId: homeId })) {
    // Does the device is currently in a group with dashboards?
    models.Display.registerChromecast(device.id, device.friendlyName)
      .then(function(display) {
        return models.Group.get(display.toJSON().group)
          .then(function(group) {
            return group.getDashboards();
          })
          .then(function(dashboards) {
            if (dashboards.length > 0) {
              logger.info('Chromecast device detected on home screen',
                          { id: device.id,
                            name: display.name,
                            chromecast: device.friendlyName
                          });
              device.application(dashkioskId, function(err, app) {
                if (err) {
                  logger.exception('Unable to find Dashkiosk application', err);
                  return;
                }
                app.run(dashkioskNs, function(err, session) {
                  if (err) {
                    logger.exception('Unable to run Dashkiosk application', err);
                    return;
                  }
                  var token = scs.encode(JSON.stringify({
                    name: display.toJSON().name
                  })),
                      url = config.get('receiver') + '#register=' + token;
                  session.send({ url: url });
                });
              });
            }
          });
      })
      .catch(function(err) {
        logger.exception('unable to register new Chromecast device', err, device);
      });
  }
}

function checkStatus(device) {
  device.status(function(err, status) {
    if (err) {
      logger.exception('unable to get status from Chromecast device');
      return;
    }
    update(device, status);
  });
}

function chromecast() {
  nodecastor.scan({ logger: logger,
                    timeout: 20000 })
    .on('online', function(device) {
      var sdev = _.pick(device, [ 'address', 'port', 'id', 'friendlyName' ]);
      logger.info('New Chromecast device discovered', sdev);

      // On connect, check status and update if needed
      device.on('connect', function() {
        checkStatus(device);
        device.on('status', function(status) {
          update(device, status);
        });
      });

      // If there is a change to a group or if a display changes of
      // group, we need to update too
      device._subscriptions = [
        bus.subscribe('group.*.dashboard.*.added', function() {
          checkStatus(device);
        }),
        bus.subscribe('display.*.group', function(data) {
          if (data.display.toJSON().chromecast === device.id) {
            checkStatus(device);
          }
        })
      ];
    })
    .on('offline', function(device) {
      // Stop handling the device
      _.each(device._subscriptions, function(s) {
        s.unsubscribe();
      });
      device.stop();
    })
    .start();
}

module.exports = chromecast;
