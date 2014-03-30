'use strict';

var _  = require('lodash'),
    util = require('util'),
    db = require('../db'),
    models = require('../models');

// Constructor. Also, name can be an existing DAO instance.
function Dashboard(url, params) {
  if (url instanceof db.Dashboard.DAO) {
    this.persistent = url;
  } else {
    params = params || {};
    this.persistent = db.Dashboard.build({
      url: url,
      description: params.description,
      timeout: params.timeout
    });
  }
}
util.inherits(Dashboard, models.Model);

Dashboard.prototype.toJSON = function() {
  return _.omit(this.persistent.values,
                [ 'createdAt', 'updatedAt', 'rank' ]);
};

Dashboard.prototype.update = function(params) {
  var self = this;
  return this.persistent.updateAttributes(_.omit(params, ['rank']))
    .then(function() {
      return self;
    });
};

module.exports = Dashboard;
