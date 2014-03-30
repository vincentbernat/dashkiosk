'use strict';

var _  = require('lodash'),
    util = require('util'),
    utils = require('../utils'),
    db = require('../db'),
    models = require('../models');

// Constructor. Also, name can be an existing DAO instance.
function Display(name, params) {
  if (name instanceof db.Display.DAO) {
    this.persistent = name;
  } else {
    params = params || {};
    this.persistent = db.Display.build({
      name: name,
      description: params.description
    });
  }
}
util.inherits(Display, models.Model);

Display.prototype.toJSON = function() {
  return _.extend(_.omit(this.persistent.values,
                         [ 'createdAt', 'updatedAt', 'GroupId' ]),
                  { group: this.persistent.GroupId });
};

Display.prototype.update = function(params) {
  var _this = this;
  return this.persistent.updateAttributes(_.omit(params, ['name']))
    .then(function() {
      return _this;
    });
};

// Associate to a group
Display.prototype.setGroup = function(group) {
  var _this = this;
  return this.persistent.setGroup(group.persistent)
    .then(function() { return _this; });
};

// Register a new or returning client
Display.register = function(name) {
  return db.Display.find({ where: { name: name }})
    .then(function(display) {
      if (display) {
        return new Display(display);
      } else {
        return db.Display.create({ name: utils.randomString(6) })
          .then(function(display) {
            return db.Group.unassigned()
              .then(function(unassigned) {
                return display.setGroup(unassigned);
              })
              .then(function() { return new Display(display); });
          });
      }
    });
};

// Get a display by name
Display.get = function(name) {
  return db.Display.find({ where: { name: name }})
    .then(function(display) {
      if (!display) {
        throw new models.NotFoundError('No display named "' + name + '"');
      }
      return new Display(display);
    });
};

// Get all displays, indexed by name
Display.all = function() {
  return db.Display.findAll()
    .then(function(displays) {
      return _.object(_.pluck(displays, 'name'),
                      _.map(displays, function(d) { return new Display(d); }));
    });
};

module.exports = Display;
