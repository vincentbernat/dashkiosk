'use strict';

var Datastore = require('nedb'),
    path      = require('path'),
    config    = require('./config');

var db = module.exports = {};

function create(name) {
  return new Datastore({
    filename: path.join(config.db, name + '.db'),
    autoload: true
  });
}

db.displays = create('displays');
db.groups = create('groups');

db.groups.ensureIndex({ fieldName: 'name', unique: true });
db.displays.ensureIndex({ fieldName: 'name', unique: true });
