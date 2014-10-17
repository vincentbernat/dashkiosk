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
              .addDashboard('http://play.grafana.org/#/dashboard/db/grafana-play-home',
                            { description: 'Grafana Play Home',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('http://play.grafana.org/#/dashboard/db/new-features-in-v18',
                            { description: 'New features in 1.8',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('http://play.grafana.org/#/dashboard/db/templated-graphs-nested',
                            { description: 'Templated graphs nested',
                              timeout: 120 });
          });
      })
      .then(function() {
        var g = new models.Group('Game of Thrones',
                                 { description: 'Countdown until the next episode of Game of Thrones' });
        return g.create()
          .then(function() {
            return g
              .addDashboard('http://www.gameofthronescountdown.com/#tully',
                            { description: 'House Tully',
                              timeout: 120 });
            })
          .then(function() {
            return g
              .addDashboard('http://www.gameofthronescountdown.com/#lannister',
                            { description: 'House Lannister',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('http://www.gameofthronescountdown.com/#stark',
                            { description: 'House Stark',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('http://www.gameofthronescountdown.com/#targaryen',
                            { description: 'House Targaryen',
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
