'use strict';

var _  = require('lodash'),
    util = require('util'),
    utils = require('../utils'),
    db = require('../db'),
    bus = require('../bus'),
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
                  { group: this.persistent.GroupId,
                    connected: this.isConnected(),
                    osd: this.osd() });
};

Display.prototype.update = function(params) {
  var self = this;
  return this.persistent.updateAttributes(_.omit(params, ['name']))
    .then(function() {
      bus.publish('display.' + self.persistent.name + '.updated',
                  { display: self });
      return self;
    });
};

// Delete
Display.prototype.delete = function() {
  var self = this;
  return this.persistent.destroy()
    .then(function() {
      bus.publish('display.' + self.persistent.name + '.deleted',
                  { display: self });
      return self;
    });
};

// Associate to a group
Display.prototype.setGroup = function(group) {
  var self = this;
  return this.persistent.setGroup(group.persistent)
    .then(function() {
      bus.publish('display.' + self.persistent.name + '.group',
                  { display: self,
                    group: group });
      return self;
    });
};

// Is the display connected
Display.prototype.isConnected = (function() {

  var connected = [];           // List of connected displays
  bus.subscribe('display.*.connected', function(data) {
    var name = data.display.toJSON().name;
    connected = _.union(connected, [ name ]);
  });
  bus.subscribe('display.*.disconnected', function(data) {
    var name = data.display.toJSON().name;
    connected = _.without(connected, name);
  });

  return function() {
    return _.contains(connected, this.persistent.name);
  };

})();

// Request a reload
Display.prototype.reload = function() {
  if (!this.isConnected()) {
    throw new models.NotFoundError('Requested display is offline.');
  }
  bus.publish('display.' + this.persistent.name + '.reload',
              { display: this });
  return this;
};

// Display something on the OSD
Display.prototype.osd = (function() {

  var texts = {};
  bus.subscribe('display.*.disconnected', function(data) {
    var name = data.display.toJSON().name;
    delete texts[name];
  });

  return function(text) {
    if (text === undefined) {
      return texts[this.persistent.name];
    }
    if (!this.isConnected()) {
      throw new models.NotFoundError('Requested display is offline.');
    }
    if (!text) {
      delete texts[this.persistent.name];
    } else {
      texts[this.persistent.name] = text;
    }
    bus.publish('display.' + this.persistent.name + '.osd',
                { display: this, text: text });
    bus.publish('display.' + this.persistent.name + '.updated',
                { display: this });
    return this;
  };
})();

// Register a new or returning client
Display.register = function(name) {
  return db.Display.find({ where: { name: name }})
    .then(function(display) {
      if (display) {
        return new Display(display);
      } else {
        return new Display(utils.randomString(6)).create()
          .then(function(display) {
            // Grab or create unassigned group
            return models.Group.unassigned()
              .then(function(unassigned) {
                return display.setGroup(unassigned);
              });
          });
      }
    });
};

// Get a display by name
Display.get = function(name) {
  return db.Display.find({ where: { name: name }})
    .then(function(display) {
      if (!display) {
        throw new models.NotFoundError('No display named "' + name + '".');
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
