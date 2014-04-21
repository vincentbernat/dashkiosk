'use strict';

var nodecastor = require('nodecastor'),
    _ = require('lodash'),
    logger   = require('./logger'),
    config   = require('./config'),
    models   = require('./models'),
    bus      = require('./bus'),
    scs      = require('./api/scs');

var homeId = '00000000-0000-0000-0000-000000000000',
    dashkioskId = config.get('chromecast:app'),
    dashkioskNs = 'urn:x-cast:com.deezer.cast.dashkiosk';

// Do something when we detect a status change from a chromecast device
function update(device, status) {

  function notRunning() {
    setTimeout(function() {
      device._updateRunning = false;
    }, 10 * 1000);
  }

  // Is the device in the home screen?
  function onHomeScreen() {
    return !!_.find(status.applications, { appId: homeId });
  }

  // Is it on Dashkiosk but without being able to retrieve a receiver?
  function outOfOrder() {
    var app = _.find(status.applications, { appId: dashkioskId });
    return (app && app.statusText.indexOf('Receiver: ' + config.get('chromecast:receiver') + '#register=') !== 0);
  }

  if (onHomeScreen() || outOfOrder()) {
    if (device._updateRunning) return;
    device._updateRunning = true;

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
                  notRunning();
                  return;
                }
                app.run(dashkioskNs, function(err, session) {
                  if (err) {
                    logger.exception('Unable to run Dashkiosk application', err);
                    notRunning();
                    return;
                  }
                  var token = scs.encode(JSON.stringify({
                    name: display.toJSON().name
                  })),
                      url = config.get('chromecast:receiver') + '#register=' + token;
                  session.send({ url: url });
                  notRunning();
                });
              });
            } else {
              notRunning();
            }
          });
      })
      .catch(function(err) {
        logger.exception('unable to register new Chromecast device', err, device);
        notRunning();
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
  var scanner = nodecastor.scan({ logger: logger,
                                  timeout: 20000 });
  scanner
    .on('online', function(device) {
      var sdev = _.pick(device, [ 'address', 'port', 'id', 'friendlyName' ]);
      logger.info('New Chromecast device discovered', sdev);

      // On connect, check status and update if needed
      device
        .on('connect', function() {
          device.on('status', function(status) {
            update(device, status);
          });
          checkStatus(device);
        })
        .on('error', function(err) {
          logger.exception('An error occurred with some Chromecast device', err, device);
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

  // To be safe, we check status of all devices every 2 minutes
  setInterval(function() {
    logger.info('Rescan Chromecast devices');
    _.each(scanner.devices, function(device) {
      checkStatus(device);
    });
  }, 2 * 60 * 1000);
}

module.exports = chromecast;
