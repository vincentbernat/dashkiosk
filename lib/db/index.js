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
        var g = new models.Group('FOSDEM',
                                 { description: 'FOSDEM videos' });
        return g.create()
          .then(function() {
            return g
              .addDashboard('https://video.fosdem.org/2021/D.emulator/cycle_perfect.mp4',
                            { description: 'Cycle-perfect is an imperfect marketing term',
                              timeout: 120 });
            })
          .then(function() {
            return g
              .addDashboard('https://video.fosdem.org/2021/D.emulator/pcsx2.mp4',
                            { description: 'The Playstation 2: from Emotion to Emulation',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('https://video.fosdem.org/2021/D.emulator/ntsc.mp4',
                            { description: 'Emulating the full NTSC stack',
                              timeout: 120 });
          })
          .then(function() {
            return g
              .addDashboard('https://video.fosdem.org/2021/D.emulator/super_mario.mp4',
                            { description: 'Do you even emulate, (Super Mario) bro?',
                              timeout: 120 });
          });
      })
      .then(function() {
        var g = new models.Group('Youtube',
                                 { description: 'Youtube videos' });
        return g.create()
          .then(function() {
            return g
              .addDashboard('https://www.youtube.com/embed/YE7VzlLtp-4?autoplay=1',
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
