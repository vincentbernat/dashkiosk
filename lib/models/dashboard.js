'use strict';

var _  = require('lodash'),
    util = require('util'),
    db = require('../db'),
    models = require('../models'),
    bus = require('../bus');

// Dashboard instances do not trigger events. Instead, there are
// appropriate methods in Group.

// Constructor. Also, name can be an existing DAO instance.
function Dashboard(url, params) {
  if (url instanceof db.Dashboard.DAO) {
    this.persistent = url;
  } else {
    params = params || {};
    this.persistent = db.Dashboard.build({
      url: url,
      description: params.description,
      timeout: params.timeout,
      viewport: params.viewport
    });
  }
}
util.inherits(Dashboard, models.Model);

Dashboard.prototype.toJSON = function() {
  return _.extend(_.omit(this.persistent.values,
                         [ 'createdAt', 'updatedAt', 'rank', 'GroupId' ]),
                  { group: this.persistent.values.GroupId,
                    active: this.isActive() });
};

// Get the current rank of a dashboard. The rank is not an array
// indice. It shouldn't be relied for sensitive operations
Dashboard.prototype.getRank = function() {
  return this.persistent.rank;
};

Dashboard.prototype.update = function(params) {
  var self = this;
  return this.persistent.updateAttributes(_.omit(params, ['rank']))
    .then(function() {
      return self;
    });
};

// Is the dashboard active?
Dashboard.prototype.isActive = (function() {
  var actives = {};
  bus.subscribe('group.*.dashboard', function(data) {
    var dashboard = data.dashboard,
        group = data.group;
    actives[dashboard.persistent.GroupId] = dashboard.persistent.id;
    bus.publish('group.' + dashboard.persistent.GroupId + '.updated',
                { group: group });
  });
  bus.subscribe('group.*.deleted', function(data) {
    var group = data.group;
    delete actives[group.persistent.id];
  });

  return function() {
    return (actives[this.persistent.GroupId] === this.persistent.id);
  };

})();

module.exports = Dashboard;
