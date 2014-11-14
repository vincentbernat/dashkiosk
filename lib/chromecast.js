'use strict';

try {
  var nodecastor = require('nodecastor');
} catch (er) {
  nodecastor = null;
}

var domain     = require('domain'),
    _ = require('lodash'),
    logger   = require('./logger'),
    config   = require('./config'),
    models   = require('./models'),
    bus      = require('./bus'),
    scs      = require('./api/scs');

var homeIds = ['00000000-0000-0000-0000-000000000000', 'E8C28D3C'],
    dashkioskId = config.get('chromecast:app'),
    dashkioskNs = 'urn:x-cast:com.deezer.cast.dashkiosk';

// Do something when we detect a status change from a chromecast device
function update(device, status) {

  function notRunning() {
    setTimeout(function() {
      device._updateRunning = false;
    }, 10 * 1000);
  }

  // Get receiver URL from configuration or try to build it if none is specified.
  function receiverUrl() {
    return config.get('chromecast:receiver') || (function() {
      return 'http://dashkiosk:' + config.get('port') + '/receiver';
    })();
  }

  // Is the device on the home screen?
  function onHomeScreen() {
    var home = !!_.find(status.applications, function(a) { return homeIds.indexOf(a.appId) !== -1; });
    logger.debug('Chromecast device is' + (home?'':' NOT') + ' on home screen',
                 { id: device.id,
                   chromecast: device.friendlyName
                 });
    return home;
  }

  // Is it on Dashkiosk but without being able to retrieve a receiver?
  function outOfOrder() {
    var app = _.find(status.applications, { appId: dashkioskId }),
        notworking = app && app.statusText.indexOf('Receiver: ' + receiverUrl() + '#register=') !== 0;
    if (notworking) {
      logger.warn('Chromecast device is NOT able to retrieve the receiver',
                 { id: device.id,
                   chromecast: device.friendlyName
                 });
    }
    return notworking;
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
                      url = receiverUrl() + '#register=' + token;
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
      logger.exception('unable to get status from Chromecast device', err);
      return;
    }
    update(device, status);
  });
}

function chromecast() {
  var scanner = nodecastor.scan({ logger: logger,
                                  timeout: 20000,
                                  reconnect: {
                                    maxRetries: Infinity
                                  }
                                });
  scanner
    .on('online', function(device) {
      var sdev = _.pick(device, [ 'address', 'port', 'id', 'friendlyName' ]);
      logger.info('New Chromecast device discovered', sdev);

      // On connect, check status and update if needed
      var offline = true;
      device
        .on('connect', function() {
          offline = false;
          checkStatus(device);
        })
        .on('disconnect', function() {
          offline = true;
        })
        .on('status', function(status) {
          if (!offline) {
            update(device, status);
          }
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
      var sdev = _.pick(device, [ 'address', 'port', 'id', 'friendlyName' ]);
      logger.info('Chromecast device offline', sdev);

      _.each(device._subscriptions, function(s) {
        s.unsubscribe();
      });
      device.stop();
    })
    .on('error', function(err) {
      logger.warn('Got some mDNS error. Let\'s ignore it.', err.message);
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

module.exports = function() {
  if (nodecastor === null) {
    logger.warn('Chromecast support is disabled due to an error when importing `nodecastor\'');
    return;
  }
  var d = domain.create();
  d.on('error', function(err) {
    logger.exception('Got an uncaught exception on the Chromecast subsystem', err);
  });
  d.run(function() {
    chromecast();
  });
};
