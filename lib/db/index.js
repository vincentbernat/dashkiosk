'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    logger = require('../logger'),
    config = require('../config'),
    Sequelize = require('sequelize'),
    sequelize = new Sequelize(config.get('db:database'),
                              config.get('db:username'),
                              config.get('db:password'),
                              _.extend(config.get('db:options'), {
                                logging: logger.debug
                              })),
    db = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

function initialize() {
  if (config.get('demo')) {
    logger.info('Demo mode enabled, populate database with premade data');
    var models = require('../models');
    return sequelize
      .query('SET FOREIGN_KEY_CHECKS = 0')
      .then(function() {}, function() { return sequelize.query('PRAGMA FOREIGN_KEYS=OFF'); })
      .then(function() {
        return sequelize
          .sync({force: true});
      })
      .then(function() {
        return sequelize
          .query('SET FOREIGN_KEY_CHECKS = 1')
          .then(function() {}, function() { return sequelize.query('PRAGMA FOREIGN_KEYS=OFF'); });
      })
      .then(function() {
        return models.Group.unassigned();
      })
      .then(function() {
        var g = new models.Group('Grafana dashboards',
                                 { description: 'Some dashboards made with Grafana' });
        return g.create()
          .then(function() {
            return g
              .addDashboard('http://play.grafana.org/dashboard/db/alerting?kiosk',
                            { description: 'Grafana Alerts',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('http://play.grafana.org/dashboard/db/prometheus-demo-dashboard?kiosk',
                            { description: 'Promotheus Demo',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('http://play.grafana.org/dashboard/db/elasticsearch-metrics?kiosk',
                            { description: 'Elasticsearch Metrics',
                              timeout: 120 });
          });
      })
      .then(function() {
        var g = new models.Group('Apple Aerial',
                                 { description: 'Apple aerial videos' });
        return g.create()
          .then(function() {
            return g
              .addDashboard('http://a1.phobos.apple.com/us/r1000/000/Features/atv/AutumnResources/videos/comp_GL_G004_C010_v03_6Mbps.mov',
                            { description: 'Greenland',
                              timeout: 120 });
            })
          .then(function() {
            return g
              .addDashboard('http://a1.phobos.apple.com/us/r1000/000/Features/atv/AutumnResources/videos/comp_DB_D011_D009_SIGNCMP_v15_6Mbps.mov',
                            { description: 'Dubai',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('http://a1.phobos.apple.com/us/r1000/000/Features/atv/AutumnResources/videos/comp_LA_A005_C009_v05_t9_6M.mov',
                            { description: 'Los Angeles',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('http://a1.phobos.apple.com/us/r1000/000/Features/atv/AutumnResources/videos/b1-4.mov',
                            { description: 'San Francisco',
                              timeout: 120 });
          });
      })
      .then(function() {
        var g = new models.Group('Videos',
                                 { description: 'Youtube videos' });
        return g.create()
          .then(function() {
            return g
              .addDashboard('http://www.youtube.com/embed/YE7VzlLtp-4?autoplay=1',
                            { description: 'Big Buck Bunny' });
          });
      })
      .then(function() {
        var g = new models.Group('WebGL',
                                 { description: 'WebGL rendering' });
        return g.create()
          .then(function() {
            return g
              .addDashboard('https://c1.goote.ch/c8a05c9a6d4a4929a3fa50e6ebdee0c3.scene/',
                            { description: 'Pearl Boy' });
          });
      });
  }
  return sequelize
    .getMigrator({
      path: path.join(config.get('path:root'), 'db', 'migrations'),
      filesFilter: /^\d.*\.js$/
    })
    .migrate();
}

module.exports = _.extend({
  initialize: initialize,
  sequelize: sequelize,
  Sequelize: Sequelize
}, db);
