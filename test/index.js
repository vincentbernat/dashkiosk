'use strict';

// Alter database configuration to use in-memory database
var config = require('../lib/config');
config.set('db:options', {
  dialect: 'sqlite',
  storage: ':memory:'
});

// Disable any logging
var logger = require('../lib/logger');
logger.unhandleExceptions();
logger.clear();

var db = require('../lib/db'),
    postal = require('postal');

module.exports = {
  db: function() {
    var s = db.sequelize;
    return s
      .query("PRAGMA foreign_keys = OFF")
      .then(function() {
        return s.sync({ force: true });
      })
      .then(function() {
        return s.query("PRAGMA foreign_keys = ON");
      });
  },
  bus: function() {
    postal.reset();
  }
};
