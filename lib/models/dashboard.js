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
  if (params.rank) {
    // Adjust rank
    var i = (this.persistent.rank - 1) / 2;
    params.rank = parseInt(params.rank);
    if (i < params.rank) {
      params.rank = params.rank * 2 + 2;
    } else {
      params.rank = params.rank * 2;
    }
  }

  var _this = this;
  return this.persistent.updateAttributes(params)
    .then(function() {
      return _this;
    });
};

module.exports = Dashboard;
