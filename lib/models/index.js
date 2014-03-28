'use strict';

var fs = require('fs'),
    path = require('path'),
    winston = require('winston'),
    config = require('../config'),
    Sequelize = require('sequelize'),
    _ = require('lodash'),
    sequelize = new Sequelize(config.db.database,
                              config.db.username,
                              config.db.password,
                              _.extend(config.db.options, {
                                logging: winston.debug
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

module.exports = _.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db);
