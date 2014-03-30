'use strict';

var _  = require('lodash'),
    util = require('util'),
    db = require('../db'),
    models = require('../models');

// Constructor. Also, name can be an existing DAO instance.
function Group(name, params) {
  if (name instanceof db.Group.DAO) {
    this.persistent = name;
  } else {
    params = params || {};
    this.persistent = db.Group.build({
      name: name,
      description: params.description
    });
  }
}
util.inherits(Group, models.Model);

// Create a new group. We check before creation to get a meaningful
// message
Group.prototype.create = function() {
  var _this = this;
  return db.Group.findOrCreate({ name: this.persistent.name },
                               this.persistent.values)
      .spread(function(group, created) {
        if (!created) {
          throw new models.ConflictError('A group with the same name already exists');
        }
        _this.persistent = group;
        return _this;
      });
};

// Delete a group
Group.prototype.delete = function() {
  var _this = this;
  return this.persistent.getDisplays()
    .then(function(displays) {
      if (displays.length) {
        throw new models.ConflictError('A group with displays attached cannot be deleed');
      }
      return _this.persistent.destroy();
    });
};

// Get dashboards from a group
Group.prototype.getDashboards = function() {
  return this.persistent.getDashboards({order: [['rank', 'ASC'],
                                                ['id', 'ASC']] })
    .then(function(dashboards) {
      return _.map(dashboards, function(d) { return new models.Dashboard(d); });
    });
};

// Get one dashboard
Group.prototype.getDashboard = function(id) {
  return this.persistent.getDashboards({ id: id })
    .then(function(dashboards) {
      if (dashboards.length === 0) {
        throw new models.NotFoundError('No dashboard with ID ' + id + ' exists');
      }
      return new models.Dashboard(dashboards[0]);
    });
};

// Add a dashboard to a group
Group.prototype.addDashboard = function(params) {
  var _this = this;
  var dashboard = new models.Dashboard(params.url,
                                       _.extend(params, { rank: 10000}));
  return dashboard.create()
    .then(function(dashboard) {
      return _this.addDashboard(dashboard)
        .then(function() {
          return _this.fixRanking();
        })
        .then(function() {
          // Shouldn't do this...
          return dashboard.persistent.reload();
        });
    });
};

// Helper function to fix dashboard ranking
Group.prototype.fixDashboardRanking = function() {
  var _this = this;
  return this.persistent.fixRanking()
    .then(function() {
      return _this;
    });
};

// Get a group by ID
Group.get = function(id) {
  return db.Group.find({ where: { id: id } })
    .then(function(group) {
      if (!group) {
        throw new models.NotFoundError('No group with ID ' + id + ' exists');
      }
      return new Group(group);
    });
};

// Get all groups
Group.all = function() {
  return db.Group.findAll()
    .then(function(groups) {
      return _.object(_.pluck(groups, 'id'),
                      _.map(groups, function(g) { return new Group(g); }));
    });
};

module.exports = Group;
